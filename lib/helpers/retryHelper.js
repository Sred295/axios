'use strict';

import utils from '../utils.js';

/**
 * Default delay function - linear backoff
 * @param {number} attempt - The current attempt number (1-based)
 * @returns {number} Delay in milliseconds
 */
const defaultDelayFn = (attempt) => attempt * 100;

/**
 * Validates and normalizes retry configuration
 * @param {any} retryConfig - The retry configuration
 * @returns {Object|null} Normalized retry config or null if disabled
 */
export const normalizeRetryConfig = (retryConfig) => {
  if (retryConfig === false || retryConfig === null || retryConfig === undefined) {
    return null;
  }

  if (retryConfig === true) {
    return {
      retries: 3,
      delay: defaultDelayFn
    };
  }

  if (utils.isObject(retryConfig)) {
    const config = {
      retries: retryConfig.retries !== undefined ? retryConfig.retries : 3,
      delay: utils.isFunction(retryConfig.delay) ? retryConfig.delay : defaultDelayFn,
      shouldRetry: utils.isFunction(retryConfig.shouldRetry) ? retryConfig.shouldRetry : null
    };

    // Validate retries is a non-negative number
    if (!utils.isNumber(config.retries) || config.retries < 0) {
      config.retries = 3;
    }

    return config;
  }

  return null;
};

/**
 * Determines if a request should be retried based on error
 * @param {Error} error - The error that occurred
 * @param {number} attempt - Current attempt number
 * @param {Function} shouldRetry - Custom retry predicate
 * @returns {boolean} Whether to retry
 */
export const shouldRetryRequest = (error, attempt, shouldRetry) => {
  // If custom shouldRetry is provided, use it
  if (shouldRetry) {
    try {
      return shouldRetry(error, attempt);
    } catch (e) {
      return false;
    }
  }

  // Default: retry on network errors and 5xx status codes
  if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Retry on 5xx server errors
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Retry on 429 (Too Many Requests) - rate limiting
  if (error.response && error.response.status === 429) {
    return true;
  }

  return false;
};

/**
 * Executes a request with retry logic
 * @param {Function} requestFn - Function that returns a promise for the request
 * @param {Object} retryConfig - Retry configuration
 * @returns {Promise} The response promise
 */
export const executeWithRetry = async (requestFn, retryConfig) => {
  if (!retryConfig) {
    return requestFn();
  }

  const { retries, delay, shouldRetry } = retryConfig;
  let lastError;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if we should retry
      if (attempt > retries || !shouldRetryRequest(error, attempt, shouldRetry)) {
        throw error;
      }

      // Calculate delay
      let delayMs = 0;
      try {
        delayMs = delay(attempt);
      } catch (e) {
        // If delay function throws, use default
        delayMs = defaultDelayFn(attempt);
      }

      // Ensure delay is a valid number
      if (!utils.isNumber(delayMs) || delayMs < 0) {
        delayMs = 0;
      }

      // Wait before retrying
      if (delayMs > 0) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
};

export default {
  normalizeRetryConfig,
  shouldRetryRequest,
  executeWithRetry
};
