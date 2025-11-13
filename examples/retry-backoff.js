/**
 * Axios Retry with Customizable Backoff Strategies
 * 
 * This example demonstrates the new retry functionality with various backoff patterns.
 */

import axios from '../index.js';

// Example 1: Basic retry with default linear backoff
console.log('Example 1: Basic retry with default linear backoff');
const basicRetry = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 3 // Will retry up to 3 times with default linear backoff
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 2: Exponential backoff
console.log('\nExample 2: Exponential backoff');
const exponentialBackoff = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 5,
        delay: (attempt) => Math.pow(2, attempt) * 100 // 200ms, 400ms, 800ms, 1600ms, 3200ms
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 3: Linear backoff with cap
console.log('\nExample 3: Linear backoff with maximum delay cap');
const cappedLinearBackoff = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 5,
        delay: (attempt) => Math.min(5000, attempt * 1000) // Max 5 seconds
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 4: Custom retry predicate for rate limiting
console.log('\nExample 4: Custom retry predicate for rate limiting');
const rateLimit = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 10,
        delay: (attempt) => attempt * 1000, // 1s, 2s, 3s, etc.
        shouldRetry: (error, attempt) => {
          // Only retry on rate limit (429) or network errors
          if (error.response?.status === 429) {
            console.log(`Rate limited, retrying in ${attempt * 1000}ms...`);
            return true;
          }
          if (error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT') {
            console.log(`Network error, retrying...`);
            return true;
          }
          return false;
        }
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 5: Jittered exponential backoff (recommended for distributed systems)
console.log('\nExample 5: Jittered exponential backoff');
const jitteredExponentialBackoff = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 5,
        delay: (attempt) => {
          // Exponential backoff with random jitter
          const baseDelay = Math.pow(2, attempt) * 100;
          const jitter = Math.random() * baseDelay * 0.1; // 10% jitter
          return baseDelay + jitter;
        }
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 6: Simple retry flag (uses default settings)
console.log('\nExample 6: Simple retry flag');
const simpleRetry = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: true // Uses default: 3 retries with linear backoff
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 7: Disable retry
console.log('\nExample 7: Disable retry');
const noRetry = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: false // No retries
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed immediately:', error.message);
  }
};

// Example 8: Global default retry configuration
console.log('\nExample 8: Global default retry configuration');
const globalRetryConfig = () => {
  // Set default retry for all requests
  axios.defaults.retry = {
    retries: 3,
    delay: (attempt) => attempt * 100
  };

  // Now all requests will use this retry configuration
  // Individual requests can still override it
};

// Example 9: Retry only on specific status codes
console.log('\nExample 9: Retry only on specific status codes');
const selectiveRetry = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 3,
        shouldRetry: (error, attempt) => {
          const retryableStatuses = [408, 429, 500, 502, 503, 504];
          const status = error.response?.status;
          const isRetryable = status && retryableStatuses.includes(status);
          
          if (isRetryable) {
            console.log(`Retrying on status ${status}...`);
          }
          
          return isRetryable;
        }
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after retries:', error.message);
  }
};

// Example 10: Retry with logging
console.log('\nExample 10: Retry with logging');
const retryWithLogging = async () => {
  try {
    const response = await axios.get('/api/endpoint', {
      retry: {
        retries: 3,
        delay: (attempt) => {
          const delay = attempt * 100;
          console.log(`Attempt ${attempt}: waiting ${delay}ms before retry...`);
          return delay;
        },
        shouldRetry: (error, attempt) => {
          console.log(`Attempt ${attempt} failed:`, error.message);
          return error.code === 'ERR_NETWORK' || error.response?.status >= 500;
        }
      }
    });
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Failed after all retries:', error.message);
  }
};

// Export examples for testing
export {
  basicRetry,
  exponentialBackoff,
  cappedLinearBackoff,
  rateLimit,
  jitteredExponentialBackoff,
  simpleRetry,
  noRetry,
  globalRetryConfig,
  selectiveRetry,
  retryWithLogging
};
