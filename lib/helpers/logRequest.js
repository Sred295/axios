'use strict';

import utils from '../utils.js';
import buildURL from './buildURL.js';
import buildFullPath from '../core/buildFullPath.js';

/**
 * Formats request data for logging, handling different data types
 * 
 * @param {any} data - The request data to format
 * @param {number} maxLength - Maximum length of data string (default: 1000)
 * @returns {string} Formatted data string
 */
function formatRequestData(data, maxLength = 1000) {
  if (data === undefined || data === null) {
    return '(no data)';
  }

  if (utils.isString(data)) {
    return data.length > maxLength ? data.substring(0, maxLength) + '... (truncated)' : data;
  }

  if (utils.isFormData(data)) {
    return '[FormData]';
  }

  if (utils.isArrayBuffer(data) || utils.isBuffer(data)) {
    return `[${data.constructor.name}] (${data.byteLength || data.length} bytes)`;
  }

  if (utils.isStream(data) || utils.isReadableStream(data)) {
    return '[Stream]';
  }

  if (utils.isFile(data) || utils.isBlob(data)) {
    return `[${data.constructor.name}] (${data.size || 'unknown size'} bytes)`;
  }

  try {
    const stringified = JSON.stringify(data);
    return stringified.length > maxLength 
      ? stringified.substring(0, maxLength) + '... (truncated)' 
      : stringified;
  } catch (e) {
    return `[${data.constructor?.name || 'Object'}] (unable to stringify)`;
  }
}

/**
 * Logs request details for debugging purposes
 * 
 * @param {Object} config - The axios request config
 * @param {boolean|Function} debug - Debug option: true for console.log, or a custom logger function
 */
export default function logRequest(config, debug) {
  if (!debug) {
    return;
  }

  const logger = typeof debug === 'function' ? debug : console.log;
  
  const fullPath = buildFullPath(config.baseURL, config.url, config.allowAbsoluteUrls);
  const finalURL = buildURL(fullPath, config.params, config.paramsSerializer);
  
  const headers = config.headers.toJSON ? config.headers.toJSON() : config.headers;
  
  const requestInfo = {
    method: (config.method || 'GET').toUpperCase(),
    url: finalURL,
    headers: headers,
    data: formatRequestData(config.data)
  };

  // Format as curl-like command for easy debugging
  const curlCommand = formatAsCurlCommand(requestInfo);
  
  logger('=== Axios Request Debug ===');
  logger(`Method: ${requestInfo.method}`);
  logger(`URL: ${requestInfo.url}`);
  logger('Headers:');
  Object.entries(requestInfo.headers).forEach(([key, value]) => {
    if (value !== null && value !== false && value !== undefined) {
      logger(`  ${key}: ${value}`);
    }
  });
  logger(`Data: ${requestInfo.data}`);
  logger('\nEquivalent curl command:');
  logger(curlCommand);
  logger('=== End Request Debug ===\n');
}

/**
 * Formats request info as a curl command for easy debugging
 * 
 * @param {Object} requestInfo - The request information object
 * @returns {string} Formatted curl command
 */
function formatAsCurlCommand(requestInfo) {
  let curl = `curl -X ${requestInfo.method} '${requestInfo.url}'`;
  
  Object.entries(requestInfo.headers).forEach(([key, value]) => {
    if (value !== null && value !== false && value !== undefined) {
      const headerValue = Array.isArray(value) ? value.join(', ') : String(value);
      curl += ` \\\n  -H '${key}: ${headerValue}'`;
    }
  });
  
  if (requestInfo.data && requestInfo.data !== '(no data)') {
    const dataStr = String(requestInfo.data);
    // Only add data if it's not a binary/stream indicator
    if (!dataStr.startsWith('[') || dataStr.includes('FormData')) {
      curl += ` \\\n  -d '${dataStr.replace(/'/g, "'\\''")}'`;
    }
  }
  
  return curl;
}

