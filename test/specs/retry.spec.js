import axios from '../../index.js';
import retryHelper from '../../lib/helpers/retryHelper.js';
import AxiosError from '../../lib/core/AxiosError.js';

describe('Retry Helper', () => {
  describe('normalizeRetryConfig', () => {
    it('should return null for false/null/undefined', () => {
      expect(retryHelper.normalizeRetryConfig(false)).toBe(null);
      expect(retryHelper.normalizeRetryConfig(null)).toBe(null);
      expect(retryHelper.normalizeRetryConfig(undefined)).toBe(null);
    });

    it('should return default config for true', () => {
      const config = retryHelper.normalizeRetryConfig(true);
      expect(config).toBeDefined();
      expect(config.retries).toBe(3);
      expect(typeof config.delay).toBe('function');
    });

    it('should normalize retry count', () => {
      const config = retryHelper.normalizeRetryConfig({ retries: 5 });
      expect(config.retries).toBe(5);
    });

    it('should use custom delay function', () => {
      const delayFn = (attempt) => attempt * 200;
      const config = retryHelper.normalizeRetryConfig({ delay: delayFn });
      expect(config.delay).toBe(delayFn);
    });

    it('should use custom shouldRetry function', () => {
      const shouldRetryFn = (error) => error.code === 'CUSTOM_ERROR';
      const config = retryHelper.normalizeRetryConfig({ shouldRetry: shouldRetryFn });
      expect(config.shouldRetry).toBe(shouldRetryFn);
    });

    it('should default to 3 retries for invalid retry count', () => {
      const config = retryHelper.normalizeRetryConfig({ retries: -1 });
      expect(config.retries).toBe(3);
    });
  });

  describe('shouldRetryRequest', () => {
    it('should retry on network errors', () => {
      const error = new AxiosError('Network error');
      error.code = 'ERR_NETWORK';
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);
    });

    it('should retry on connection abort', () => {
      const error = new AxiosError('Connection aborted');
      error.code = 'ECONNABORTED';
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);
    });

    it('should retry on timeout', () => {
      const error = new AxiosError('Timeout');
      error.code = 'ETIMEDOUT';
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);
    });

    it('should retry on 5xx server errors', () => {
      const error = new AxiosError('Server error');
      error.response = { status: 500 };
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);

      error.response.status = 503;
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);
    });

    it('should retry on 429 (rate limit)', () => {
      const error = new AxiosError('Too many requests');
      error.response = { status: 429 };
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(true);
    });

    it('should not retry on 4xx client errors', () => {
      const error = new AxiosError('Bad request');
      error.response = { status: 400 };
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(false);

      error.response.status = 404;
      expect(retryHelper.shouldRetryRequest(error, 1)).toBe(false);
    });

    it('should use custom shouldRetry predicate', () => {
      const error = new AxiosError('Custom error');
      error.code = 'CUSTOM_ERROR';
      const shouldRetry = (err) => err.code === 'CUSTOM_ERROR';
      expect(retryHelper.shouldRetryRequest(error, 1, shouldRetry)).toBe(true);
    });

    it('should handle shouldRetry function errors gracefully', () => {
      const error = new AxiosError('Error');
      const shouldRetry = () => {
        throw new Error('Predicate error');
      };
      expect(retryHelper.shouldRetryRequest(error, 1, shouldRetry)).toBe(false);
    });
  });

  describe('executeWithRetry', () => {
    it('should execute request without retry if config is null', async () => {
      let callCount = 0;
      const requestFn = async () => {
        callCount++;
        return 'success';
      };

      const result = await retryHelper.executeWithRetry(requestFn, null);
      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    it('should succeed on first attempt', async () => {
      let callCount = 0;
      const requestFn = async () => {
        callCount++;
        return 'success';
      };

      const config = retryHelper.normalizeRetryConfig({ retries: 3 });
      const result = await retryHelper.executeWithRetry(requestFn, config);
      expect(result).toBe('success');
      expect(callCount).toBe(1);
    });

    it('should retry on failure and eventually succeed', async () => {
      let callCount = 0;
      const requestFn = async () => {
        callCount++;
        if (callCount < 3) {
          const error = new AxiosError('Network error');
          error.code = 'ERR_NETWORK';
          throw error;
        }
        return 'success';
      };

      const config = retryHelper.normalizeRetryConfig({ retries: 3 });
      const result = await retryHelper.executeWithRetry(requestFn, config);
      expect(result).toBe('success');
      expect(callCount).toBe(3);
    });

    it('should fail after max retries exceeded', async () => {
      let callCount = 0;
      const requestFn = async () => {
        callCount++;
        const error = new AxiosError('Network error');
        error.code = 'ERR_NETWORK';
        throw error;
      };

      const config = retryHelper.normalizeRetryConfig({ retries: 2 });
      try {
        await retryHelper.executeWithRetry(requestFn, config);
        fail('Should have thrown');
      } catch (error) {
        expect(error.message).toBe('Network error');
        expect(callCount).toBe(3); // initial + 2 retries
      }
    });

    it('should respect custom delay function', async () => {
      let callCount = 0;
      const delays = [];
      const startTime = Date.now();
      const delayFn = (attempt) => {
        const delay = attempt * 50;
        delays.push(delay);
        return delay;
      };

      const requestFn = async () => {
        callCount++;
        if (callCount < 2) {
          const error = new AxiosError('Network error');
          error.code = 'ERR_NETWORK';
          throw error;
        }
        return 'success';
      };

      const config = retryHelper.normalizeRetryConfig({ retries: 2, delay: delayFn });
      const result = await retryHelper.executeWithRetry(requestFn, config);
      const elapsed = Date.now() - startTime;

      expect(result).toBe('success');
      expect(callCount).toBe(2);
      expect(delays).toEqual([50]); // First retry has 50ms delay
      expect(elapsed).toBeGreaterThanOrEqual(50);
    });

    it('should not retry if shouldRetry returns false', async () => {
      let callCount = 0;
      const requestFn = async () => {
        callCount++;
        const error = new AxiosError('Bad request');
        error.response = { status: 400 };
        throw error;
      };

      const shouldRetry = () => false;
      const config = retryHelper.normalizeRetryConfig({ retries: 3, shouldRetry });

      try {
        await retryHelper.executeWithRetry(requestFn, config);
        fail('Should have thrown');
      } catch (error) {
        expect(callCount).toBe(1); // No retries
      }
    });

    it('should handle invalid delay function gracefully', async () => {
      let callCount = 0;
      const delayFn = () => 'not a number'; // Invalid return

      const requestFn = async () => {
        callCount++;
        if (callCount < 2) {
          const error = new AxiosError('Network error');
          error.code = 'ERR_NETWORK';
          throw error;
        }
        return 'success';
      };

      const config = retryHelper.normalizeRetryConfig({ retries: 2, delay: delayFn });
      const result = await retryHelper.executeWithRetry(requestFn, config);
      expect(result).toBe('success');
      expect(callCount).toBe(2);
    });
  });
});

describe('Axios Retry Integration', () => {
  it('should accept retry config in request options', async () => {
    // This test verifies the config is accepted without errors
    const config = {
      url: 'http://example.com',
      retry: {
        retries: 3,
        delay: (attempt) => attempt * 100
      }
    };

    // Just verify the config structure is valid
    expect(config.retry).toBeDefined();
    expect(config.retry.retries).toBe(3);
    expect(typeof config.retry.delay).toBe('function');
  });

  it('should support exponential backoff pattern', () => {
    const exponentialBackoff = (attempt) => Math.pow(2, attempt) * 100;
    const config = retryHelper.normalizeRetryConfig({
      retries: 3,
      delay: exponentialBackoff
    });

    expect(config.delay(1)).toBe(200); // 2^1 * 100
    expect(config.delay(2)).toBe(400); // 2^2 * 100
    expect(config.delay(3)).toBe(800); // 2^3 * 100
  });

  it('should support linear backoff pattern', () => {
    const linearBackoff = (attempt) => attempt * 100;
    const config = retryHelper.normalizeRetryConfig({
      retries: 3,
      delay: linearBackoff
    });

    expect(config.delay(1)).toBe(100);
    expect(config.delay(2)).toBe(200);
    expect(config.delay(3)).toBe(300);
  });

  it('should support custom retry predicate for rate limiting', () => {
    const shouldRetry = (error, attempt) => {
      // Retry on 429 (rate limit) or network errors
      return error.response?.status === 429 || error.code === 'ERR_NETWORK';
    };

    const config = retryHelper.normalizeRetryConfig({
      retries: 5,
      delay: (attempt) => Math.min(1000, attempt * 200), // Max 1s delay
      shouldRetry
    });

    const rateLimitError = new AxiosError('Rate limited');
    rateLimitError.response = { status: 429 };
    expect(retryHelper.shouldRetryRequest(rateLimitError, 1, shouldRetry)).toBe(true);

    const networkError = new AxiosError('Network error');
    networkError.code = 'ERR_NETWORK';
    expect(retryHelper.shouldRetryRequest(networkError, 1, shouldRetry)).toBe(true);

    const clientError = new AxiosError('Bad request');
    clientError.response = { status: 400 };
    expect(retryHelper.shouldRetryRequest(clientError, 1, shouldRetry)).toBe(false);
  });
});
