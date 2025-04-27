import assert from 'assert';
import axios from '../../../index.js';
import AxiosError from '../../../lib/core/AxiosError.js';
import {
  LOCAL_SERVER_HTTP2_URL,
  setTimeoutAsync,
  startHTTP2Server,
  stopHTTP2Server
} from '../../helpers/server.js';

const http2Axios = axios.create({
  baseURL: LOCAL_SERVER_HTTP2_URL,
  adapter: 'http2',
  http2Options: {
    rejectUnauthorized: false
  }
});

let server;

function sanitizeUrl(unsafe) {
  return unsafe
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

describe('supports http2 with nodejs', () => {
  afterEach(async function () {
    await stopHTTP2Server(server);

    server = null;
  });

  it('should support IPv4 literal strings', async () => {
    const originalData = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };
    server = await startHTTP2Server((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(originalData))
    });

    const { data } = await http2Axios.get('/');

    assert.deepStrictEqual(data, originalData);
  });

  describe('timeout', () => {

    it('should respect the timeout property', async () => {
      server = await startHTTP2Server((req, res) => {
        setTimeout(() => {
          res.end();
        }, 1000);
      });

      let success = false, failure = false;
      let error;

      try {
        await http2Axios.get('/', {
          timeout: 250
        });
        success = true;
      } catch (err) {
        error = err;
        failure = true;
      }

      assert.strictEqual(success, false, 'request should not succeed');
      assert.strictEqual(failure, true, 'request should fail');
      assert.strictEqual(error.code, 'ABORT_ERR');
      assert.strictEqual(error.message, 'The operation was aborted');
    });
  });

  it('should allow passing JSON', async () => {
    const data = {
      firstName: 'Fred',
      lastName: 'Flintstone',
      emailAddr: 'fred@example.com'
    };

    server = await startHTTP2Server((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(data));
    });

    const { data: responseData } = await http2Axios.get('/');

    assert.deepStrictEqual(responseData, data);
  });

  it('should support basic auth with a header', async () => {
    server = await startHTTP2Server((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(req.headers.authorization);
    });

    const auth = { username: 'foo', password: 'bar' };
    const headers = { Authorization: 'Bearer 1234' };

    const res = await http2Axios.get('', { auth, headers });

    const base64 = Buffer.from('foo:bar', 'utf8').toString('base64');
    assert.strictEqual(res.data, 'Basic ' + base64);
  });

  it('should combine baseURL and url', async () => {
    server = await startHTTP2Server((req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(req.headers));
    });

    const res = await http2Axios('/foo');

    assert.equal(res.config.baseURL, LOCAL_SERVER_HTTP2_URL);
    assert.equal(res.config.url, '/foo');
  });

  it('should support params', async () => {
    server = await startHTTP2Server((req, res) => {
      res.end(sanitizeUrl(req.url));
    });

    const { data } = await http2Axios.get('/?test=1', {
      params: {
        foo: 1,
        bar: 2
      }
    });

    assert.strictEqual(data, '/?test=1&foo=1&bar=2');
  });

  it('should get response headers', async () => {
    server = await startHTTP2Server((req, res) => {
      res.setHeader('foo', 'bar');
      res.end(sanitizeUrl(req.url));
    });

    const { headers } = await http2Axios.get('/', {
      responseType: 'stream'
    });

    assert.strictEqual(headers.get('foo'), 'bar');
  });
});
