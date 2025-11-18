'use strict';

import utils from '../utils.js';

/**
 * Create an Error with the specified message, config, error code, request and response.
 *
 * @param {string} message The error message.
 * @param {string} [code] The error code (for example, 'ECONNABORTED').
 * @param {Object} [config] The config.
 * @param {Object} [request] The request.
 * @param {Object} [response] The response.
 *
 * @returns {Error} The created error.
 */
class AxiosError extends Error {
  constructor(message, code, config, request, response) {
    super(message);
    this.name = 'AxiosError';
    this.code = code;
    this.config = config;
    this.request = request;
    this.response = response;

    // Ensure the cause property is configurable
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  // Custom toJSON method to handle circular references
  toJSON() {
    const { message, name, code, config, request, response } = this;

    return {
      message,
      name,
      code,
      config,
      request: request ? removeCircularReferences(request) : undefined,
      response: response ? removeCircularReferences(response) : undefined,
    };
  }
}

// Function to remove circular references
const removeCircularReferences = (obj) => {
  const seen = new WeakSet();
  const replaceCircular = (value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return {}; // Replace the entire object with an empty object
      }
      seen.add(value);
      for (const key in value) {
        if (typeof value[key] === 'object' && value[key] !== null) {
          if (seen.has(value[key])) {
            value[key] = {}; // Replace circular references with an empty object
          } else {
            replaceCircular(value[key]); // Recursively check nested objects
          }
        }
      }
    }
    return value;
  };
  return replaceCircular(obj);
};

// Ensure the cause property is non-enumerable
Object.defineProperty(AxiosError.prototype, 'cause', {
  configurable: true,
  enumerable: false, // Exclude from JSON serialization
  writable: true,
});

const prototype = AxiosError.prototype;
const descriptors = {};

[
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ECONNABORTED',
  'ETIMEDOUT',
  'ERR_NETWORK',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_DEPRECATED',
  'ERR_BAD_RESPONSE',
  'ERR_BAD_REQUEST',
  'ERR_CANCELED',
  'ERR_NOT_SUPPORT',
  'ERR_INVALID_URL'
// eslint-disable-next-line func-names
].forEach(code => {
  descriptors[code] = {value: code};
});

Object.defineProperties(AxiosError, descriptors);
Object.defineProperty(prototype, 'isAxiosError', {value: true});


// AxiosError.from method
AxiosError.from = (error, code, config, request, response, customProps) => {
  const axiosError = Object.create(prototype);

  utils.toFlatObject(error, axiosError, function filter(obj) {
    return obj !== Error.prototype;
  }, prop => {
    return prop !== 'isAxiosError';
  });

  const msg = error && error.message ? error.message : 'Error';

  // Prefer explicit code; otherwise copy the low-level error's code (e.g. ECONNREFUSED)
  const errCode = code == null && error ? error.code : code;

  // Create a new AxiosError instance
  const axiosErrorInstance = new AxiosError(msg, errCode, config, request, response);

  // Chain the original error on the standard field; non-enumerable to avoid JSON noise
  if (error && axiosErrorInstance.cause == null) {
    Object.defineProperty(axiosErrorInstance, 'cause', { value: error, configurable: true });
  }

  axiosErrorInstance.name = (error && error.name) || 'Error';

  // Add custom properties, if provided
  customProps && Object.assign(axiosErrorInstance, customProps);

  return axiosErrorInstance;  // Return the created instance
};


export default AxiosError;
