'use strict';

import utils from '../utils.js';
import AxiosError from '../core/AxiosError.js';
import AxiosHeaders from '../core/AxiosHeaders.js';
import composeSignals from './composeSignals.js';

export const DEFAULT_BASE_DELAY_MS = 100;

export const DEFAULT_IDEMPOTENT_METHODS = ['get', 'head', 'options', 'trace'];

export function parseRetryAfterHeader(header, now = new Date()) {
  if (!header) return undefined;
  const secs = Number(header);
  if (!Number.isNaN(secs)) return Math.max(0, secs * 1000);
  const date = new Date(header);
  const ms = date - now;
  return Number.isFinite(ms) ? Math.max(0, ms) : undefined;
}

export function computeBackoffDelay(attempt, base = DEFAULT_BASE_DELAY_MS, mode = 'exponential', jitter = 'full') {
  let delay;
  switch (mode) {
    case 'fixed':
      delay = base;
      break;
    case 'linear':
      delay = base * attempt;
      break;
    case 'none':
      delay = 0;
      break;
    case 'exponential':
    default:
      delay = base * attempt * attempt;
  }
  if (delay <= 0) return 0;
  if (jitter === 'none') return delay;
  const rand = Math.random();
  return jitter === 'equal' ? delay - delay * 0.5 + rand * (delay * 0.5) : rand * delay; // full
}

export function isRetryableNetworkError(error) {
  const code = error && (error.code || (error.cause && error.cause.code));
  const retryable = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
  return error && (error.isAxiosError || error instanceof Error) && (
    error.code === AxiosError.ERR_NETWORK || (code && retryable.includes(code))
  );
}

export function isRetryableResponse(response) {
  if (!response) return false;
  const status = response.status;
  return status === 429 || status === 503;
}

export function getRetryAfterDelay(headers, now = new Date()) {
  const h = AxiosHeaders.from(headers);
  const value = h && (h.get('retry-after') || h.get('Retry-After'));
  return parseRetryAfterHeader(value, now);
}

export function shouldRetryDefault(error, attempt) {
  if (error && error.response) {
    return isRetryableResponse(error.response);
  }
  return isRetryableNetworkError(error);
}

export function getRetryConfig(config) {
  const retry = config && config.retry || {};
  return {
    retries: utils.toFiniteNumber(retry.retries) || 0,
    retryDelay: retry.retryDelay,
    retryCondition: retry.retryCondition,
    shouldResetTimeout: !!retry.shouldResetTimeout,
    methods: Array.isArray(retry.methods) ? retry.methods.map(m => String(m).toLowerCase()) : DEFAULT_IDEMPOTENT_METHODS,
    respectRetryAfter: utils.isBoolean(retry.respectRetryAfter) ? retry.respectRetryAfter : true,
    backoff: retry.backoff || 'exponential',
    jitter: retry.jitter || 'full',
    maxRetryAfter: utils.toFiniteNumber(retry.maxRetryAfter)
  }
}

export async function delayWithCancellation(ms, signal) {
  if (!ms || ms <= 0) return;
  return await new Promise((resolve, reject) => {
    let timer = setTimeout(resolve, ms);
    if (signal) {
      const onabort = () => {
        clearTimeout(timer);
        timer = null;
        const reason = signal.reason instanceof Error ? signal.reason : new AxiosError('canceled', AxiosError.ECANCELED);
        reject(reason);
      };
      if (signal.aborted) return onabort();
      signal.addEventListener('abort', onabort, { once: true });
    }
  });
}

export function composeAttemptSignal(originalSignal, timeoutMs) {
  const signal = composeSignals([originalSignal], timeoutMs);
  return signal || originalSignal;
}


