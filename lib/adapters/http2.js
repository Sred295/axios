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

const activeSessions = new Map();

function getSession(url, http2Options = {}, onError) {
  const authority = url.protocol + '//' + url.hostname + (url.port ? ':' + url.port : '');
  if (activeSessions.has(authority)) {
    const session = activeSessions.get(authority);
    if (!session.closed && !session.destroyed) {
      return session;
    }
    activeSessions.delete(authority);
  }

  const sessionTimeout = http2Options.sessionTimeout || 1000;
  const session = connect(authority, http2Options);

  session.setTimeout(sessionTimeout, () => {
    session.close(NGHTTP2_NO_ERROR);
  });

  session.once('error', onError);
  session.once('close', () => {
    activeSessions.delete(authority);
  });

  activeSessions.set(authority, session);
  return session;
}

function handleRequestError(err, reject, unsubscribe, config, request) {
  unsubscribe && unsubscribe();
  reject(AxiosError.from(err, err && err.code, config, request));
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

      const requestBodyBuffer = resolvedOptions.body && Buffer.from(JSON.stringify(resolvedOptions.body));
      const responseData = [];

      const session = getSession(parsed, http2Options, (err) => {
        handleRequestError(err, reject, unsubscribe, config, request);
      });

      const request = session.request({
        [HTTP2_HEADER_SCHEME]: parsed.protocol.replace(':', ''),
        [HTTP2_HEADER_METHOD]: resolvedOptions.method,
        [HTTP2_HEADER_PATH]: (parsed.pathname || '/') + (parsed.search || ''),
        ...resolvedOptions.headers
      }, {
        signal: resolvedOptions.signal,
      });

      request.on('error', (err) => {
        handleRequestError(err, reject, unsubscribe, config, request);
      });

      request.on('response', (headers) => {
        const status = headers[HTTP2_HEADER_STATUS];

        request.on('data', (chunk) => {
          responseData.push(chunk);
        });

        request.on('end', () => {
          unsubscribe && unsubscribe();

          const responseType = config && config.responseType;
          const contentType = headers['content-type'] || headers['Content-Type'] || responseType || '';

          let data = Buffer.concat(responseData).toString('utf8');
          if (/^application\/json\b/i.test(contentType.trim())) {
            try {
              data = JSON.parse(data);
            } catch (err) {
              reject(AxiosError.from(err, AxiosError.ERR_BAD_RESPONSE, config, request, {
                status: status,
                headers: AxiosHeaders.from(headers)
              }));
              return;
            }
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

      requestBodyBuffer && request.write(requestBodyBuffer);
      request.end();
    });
  }
}

export const getHttp2 = () => {
  return factory();
};

const adapter = getHttp2();

export default adapter;
