// lib/helpers/proxyFromEnvAdapter.js
const { getProxyForUrl } = require('proxy-from-env');
const { HttpProxyAgent } = require('http-proxy-agent');
const { HttpsProxyAgent } = require('https-proxy-agent');
const { URL } = require('url');

/**
 * Create an Axios adapter wrapper that auto-injects proxy agents from environment
 * into axios config when user didn't provide manual proxy/agent config.
 *
 * Usage:
 *   const adapterWithAutoProxy = proxyFromEnvAdapter(originalAdapter)
 *   axios.defaults.adapter = adapterWithAutoProxy
 *
 * Rules:
 * - If config.proxy is explicitly set (including false), or config.httpAgent/httpsAgent
 *   or config.agent provided, do nothing (manual config wins).
 * - Uses proxy-from-env's getProxyForUrl(url) which respects NO_PROXY.
 * - Uses http-proxy-agent for http:, https-proxy-agent for https: (for target scheme).
 * - Caches agents per proxy URL to reuse agents (Map).
 */
function proxyFromEnvAdapter(adapter) {
  if (!adapter) {
    throw new Error('proxyFromEnvAdapter requires an underlying adapter');
  }

  // Cache of created agents: key = proxyUrl (string) + '|' + scheme
  const agentCache = new Map();

  function getAgentForProxy(proxyUrl, scheme) {
    const key = `${proxyUrl}|${scheme}`;
    if (agentCache.has(key)) return agentCache.get(key);

    const agent = (scheme === 'http:')
      ? new HttpProxyAgent(proxyUrl)
      : new HttpsProxyAgent(proxyUrl);

    // store and return
    agentCache.set(key, agent);
    return agent;
  }

  function getRequestUrl(config) {
    // Try to resolve the final absolute URL for the request (axios config typically has url + baseURL)
    // If url is absolute, URL constructor handles it. If relative, baseURL required.
    // Fall back to config.baseURL if present; if neither, return null to skip proxy detection.
    try {
      if (!config.url) return null;

      // If url is already absolute, new URL(url) works, otherwise use baseURL or undefined.
      if (/^https?:\/\//i.test(config.url)) {
        return new URL(config.url);
      }

      const base = config.baseURL || null;
      if (!base) return null; // can't resolve relative URL without base
      return new URL(config.url, base);
    } catch (err) {
      // On any parse error, return null to avoid accidentally injecting proxy
      return null;
    }
  }

  return async function wrappedAdapter(config) {
    // Manual overrides: Respect user's explicit config.
    // If user set proxy explicitly (includes proxy: false), or provided httpAgent/httpsAgent or agent, do nothing.
    if (
      Object.prototype.hasOwnProperty.call(config, 'proxy') && config.proxy !== undefined
      || config.httpAgent
      || config.httpsAgent
      || config.agent
    ) {
      return adapter(config);
    }

    // Build the request URL
    const reqUrl = getRequestUrl(config);
    if (!reqUrl) {
      // cannot determine URL (relative without base) — don't auto-configure proxy
      return adapter(config);
    }

    const fullUrl = reqUrl.toString();
    // Use proxy-from-env which respects NO_PROXY internally
    const proxyForUrl = getProxyForUrl(fullUrl);

    if (!proxyForUrl) {
      // no proxy for this URL according to env/NO_PROXY
      return adapter(config);
    }

    // create/reuse agent based on request scheme (http: vs https:)
    const scheme = reqUrl.protocol; // 'http:' or 'https:'
    const agent = getAgentForProxy(proxyForUrl, scheme);

    // We must set correct config field: axios uses httpAgent for http and httpsAgent for https
    const newConfig = Object.assign({}, config);

    if (scheme === 'http:') {
      // For HTTP, axios expects httpAgent
      newConfig.httpAgent = newConfig.httpAgent || agent;
    } else if (scheme === 'https:') {
      // For HTTPS, axios expects httpsAgent
      newConfig.httpsAgent = newConfig.httpsAgent || agent;
    } else {
      // unknown scheme: don't modify
    }

    // Important: do not set 'proxy' property (we're using node agent approach)
    return adapter(newConfig);
  };
}

module.exports = proxyFromEnvAdapter;
