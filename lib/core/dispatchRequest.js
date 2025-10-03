'use strict';

import transformData from './transformData.js';
import isCancel from '../cancel/isCancel.js';
import defaults from '../defaults/index.js';
import CanceledError from '../cancel/CanceledError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import adapters from "../adapters/adapters.js";
import utils from '../utils.js';
import {
  getRetryConfig,
  shouldRetryDefault,
  getRetryAfterDelay,
  computeBackoffDelay,
  delayWithCancellation,
  composeAttemptSignal
} from "../helpers/retry.js";

/**
 * Throws a `CanceledError` if cancellation has been requested.
 *
 * @param {Object} config The config that is to be used for the request
 *
 * @returns {void}
 */
function throwIfCancellationRequested(config) {
  if (config.cancelToken) {
    config.cancelToken.throwIfRequested();
  }

  if (config.signal && config.signal.aborted) {
    throw new CanceledError(null, config);
  }
}

/**
 * Dispatch a request to the server using the configured adapter.
 *
 * @param {object} config The config that is to be used for the request
 *
 * @returns {Promise} The Promise to be fulfilled
 */
export default async function dispatchRequest(config) {
  throwIfCancellationRequested(config);

  config.headers = AxiosHeaders.from(config.headers);

  // Transform request data
  config.data = transformData.call(
    config,
    config.transformRequest
  );

  if (['post', 'put', 'patch'].indexOf(config.method) !== -1) {
    config.headers.setContentType('application/x-www-form-urlencoded', false);
  }

  const adapter = adapters.getAdapter(config.adapter || defaults.adapter, config);

  const retryCfg = getRetryConfig(config);
  const tryMethods = retryCfg.methods || [];
  const method = String(config.method || 'get').toLowerCase();
  const totalAttempts = 1 + (tryMethods.includes(method) ? retryCfg.retries : 0);

  const startedAt = Date.now();
  let attempt = 0;
  let lastError;

  while (attempt < totalAttempts) {
    attempt++;

    throwIfCancellationRequested(config);

    const originalTimeout = config.timeout;
    const timeoutForAttempt = retryCfg.shouldResetTimeout ? originalTimeout : (function () {
      if (!originalTimeout) return originalTimeout;
      const elapsed = Date.now() - startedAt;
      const remaining = Math.max(0, parseInt(originalTimeout, 10) - elapsed);
      return remaining || 0;
    }());

    const attemptConfig = {
      ...config,
      signal: composeAttemptSignal(config.signal, timeoutForAttempt)
    };

    try {
      const response = await adapter(attemptConfig);

      // transform on success
      response.data = transformData.call(
        config,
        config.transformResponse,
        response
      );
      response.headers = AxiosHeaders.from(response.headers);

      return response;
    } catch (err) {
      lastError = err;

      if (isCancel(err)) {
        // Do not retry canceled requests
        throw err;
      }

      // transform error response data before deciding to retry
      if (err && err.response) {
        err.response.data = transformData.call(
          config,
          config.transformResponse,
          err.response
        );
        err.response.headers = AxiosHeaders.from(err.response.headers);
      }

      if (attempt >= totalAttempts) {
        break;
      }

      const userRetryCondition = retryCfg.retryCondition;
      const shouldRetry = typeof userRetryCondition === 'function'
        ? !!userRetryCondition(err, attempt, err && err.response)
        : shouldRetryDefault(err, attempt);

      if (!shouldRetry) {
        break;
      }

      let delay = 0;
      if (retryCfg.respectRetryAfter && err && err.response) {
        const ra = getRetryAfterDelay(err.response.headers);
        if (typeof ra === 'number') {
          delay = ra;
          if (retryCfg.maxRetryAfter && delay > retryCfg.maxRetryAfter) {
            delay = retryCfg.maxRetryAfter;
          }
        }
      }

      if (!delay) {
        const retryDelay = retryCfg.retryDelay;
        if (typeof retryDelay === 'function') {
          delay = Math.max(0, Number(retryDelay(err, attempt, err && err.response)) || 0);
        } else if (utils.toFiniteNumber(retryDelay)) {
          delay = utils.toFiniteNumber(retryDelay);
        } else {
          delay = computeBackoffDelay(attempt, undefined, retryCfg.backoff, retryCfg.jitter);
        }
      }

      // Wait with cancellation support
      const waitSignal = composeAttemptSignal(config.signal);
      try {
        await delayWithCancellation(delay, waitSignal);
      } catch (e) {
        // canceled while waiting
        throw e;
      }
      // loop continues to next attempt
    }
  }

  return Promise.reject(lastError);
}
