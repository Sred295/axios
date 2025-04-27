import http2, { connect, constants } from 'http2';
import AxiosError from "../core/AxiosError.js";
import AxiosHeaders from "../core/AxiosHeaders.js";
import settle from "../core/settle.js";
import composeSignals from "../helpers/composeSignals.js";
import resolveConfig from "../helpers/resolveConfig.js";
import platform from "../platform/index.js";
import buildFullPath from '../core/buildFullPath.js';

const {
  NGHTTP2_NO_ERROR,
  HTTP2_HEADER_SCHEME,
  HTTP2_HEADER_METHOD,
  HTTP2_HEADER_PATH,
  HTTP2_HEADER_STATUS
} = constants;

const activeHttp2Sessions = new Map();

function getConnection(options, http2Options = {}) {
  const authority = options.protocol + '//' + options.hostname + (options.port ? ':' + options.port : '');
  if (activeHttp2Sessions.has(authority)) {
    const session = activeHttp2Sessions.get(authority);
    if (!session.closed && !session.destroyed) {
      return session;
    }
    activeHttp2Sessions.delete(authority);
  }

  const connection = connect(authority, http2Options);
  const connectionTimeout = http2Options.connectionTimeout || 1000;
  connection.setTimeout(connectionTimeout, () => {
    activeHttp2Sessions.delete(authority);
    connection.close(NGHTTP2_NO_ERROR);
  });
  activeHttp2Sessions.set(authority, connection);
  return connection;
}

const factory = () => {
  const isHttp2AdapterSupported = platform.isNode && typeof http2 !== 'undefined';
  if (!isHttp2AdapterSupported) {
    return false;
  }

  return async (config) => {
    return await new Promise((resolve, reject) => {
      const {
        url,
        method,
        data,
        signal,
        cancelToken,
        timeout,
        headers,
        allowAbsoluteUrls,
        baseURL,
        http2Options,
      } = resolveConfig(config);

      const composedSignal = composeSignals([signal, cancelToken && cancelToken.toAbortSignal()], timeout);
      const fullPath = buildFullPath(baseURL, url, allowAbsoluteUrls);
      const parsed = new URL(fullPath);

      const unsubscribe = composedSignal && composedSignal.unsubscribe && (() => {
        composedSignal.unsubscribe();
      });

      const resolvedOptions = {
        signal: composedSignal,
        method: method.toUpperCase(),
        headers: headers.normalize().toJSON(),
        body: data,
      };

      const buffer = resolvedOptions.body && Buffer.from(JSON.stringify(resolvedOptions.body));

      const responseData = [];
      const connection = getConnection(parsed, http2Options);
      const request = connection.request({
        [HTTP2_HEADER_SCHEME]: parsed.protocol.replace(':', ''),
        [HTTP2_HEADER_METHOD]: resolvedOptions.method,
        [HTTP2_HEADER_PATH]: (parsed.pathname || '/') + (parsed.search || ''),
        ...resolvedOptions.headers
      }, {
        signal: resolvedOptions.signal,
      });

      request.on('error', (err) => {
        unsubscribe && unsubscribe();
        reject(AxiosError.from(err, err && err.code, config, request));
      });

      request.on('response', (headers) => {
        const status = headers[HTTP2_HEADER_STATUS];

        request.on('data', (chunk) => {
          responseData.push(chunk);
        });

        request.on('end', () => {
          unsubscribe && unsubscribe();

          const contentType = headers['content-type'] || headers['Content-Type'] || '';
          const responseType = config && config.responseType;

          let data;
          if (responseType === 'arraybuffer' || responseType === 'blob' ||
            /^application\/octet-stream/i.test(contentType)) {
            data = Buffer.concat(responseData);
          } else {
            data = Buffer.concat(responseData).toString('utf8');
          }

          settle(resolve, reject, {
            data,
            headers: AxiosHeaders.from(headers),
            status: status,
            statusText: undefined, // HTTP/2 does not have statusText, we need to map status code to status text.
            config,
            request
          })
        });
      });

      buffer && request.write(buffer);
      request.end();
    });
  }
}

export const getHttp2 = (config) => {
  return factory(config);
};

const adapter = getHttp2();

export default adapter;
