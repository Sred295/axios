// test/proxyFromEnvAdapter.test.js
const assert = require('assert');
const { getProxyForUrl } = require('proxy-from-env');
const proxyFromEnvAdapter = require('../lib/helpers/proxyFromEnvAdapter');

describe('proxyFromEnvAdapter', () => {
  const dummyAdapter = async (config) => ({ config }); // returns config for inspection
  const wrapped = proxyFromEnvAdapter(dummyAdapter);

  afterEach(() => {
    delete process.env.HTTP_PROXY;
    delete process.env.HTTPS_PROXY;
    delete process.env.NO_PROXY;
  });

  it('should not override manual httpAgent/httpsAgent/config.proxy', async () => {
    const customAgent = {};
    const res = await wrapped({ url: 'http://example.com', httpAgent: customAgent });
    assert.strictEqual(res.config.httpAgent, customAgent);
  });

  it('should inject httpAgent when HTTP_PROXY is set and request is http', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:3128';
    const res = await wrapped({ url: 'http://example.com' });
    assert(res.config.httpAgent, 'httpAgent should be set');
  });

  it('should inject httpsAgent when HTTPS_PROXY is set and request is https', async () => {
    process.env.HTTPS_PROXY = 'http://127.0.0.1:3128';
    const res = await wrapped({ url: 'https://example.com' });
    assert(res.config.httpsAgent, 'httpsAgent should be set');
  });

  it('should respect NO_PROXY and not set agent when host excluded', async () => {
    process.env.HTTP_PROXY = 'http://127.0.0.1:3128';
    process.env.NO_PROXY = 'example.com';
    const res = await wrapped({ url: 'http://example.com' });
    assert(!res.config.httpAgent);
  });
});
