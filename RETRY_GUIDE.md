# Axios Retry with Customizable Backoff Strategies

This guide explains how to use the new retry functionality in Axios with customizable delay and backoff strategies.

## Overview

The retry feature allows you to automatically retry failed requests with configurable delays and backoff strategies. This is particularly useful for:

- Handling API rate limits (429 responses)
- Dealing with temporary network failures
- Reducing load on servers during outages
- Implementing exponential or incremental backoff patterns
- Working in distributed or unstable network environments

## Basic Usage

### Simple Retry

Enable retry with default settings (3 retries, linear backoff):

```javascript
axios.get('/api/endpoint', {
  retry: true
});
```

### Disable Retry

```javascript
axios.get('/api/endpoint', {
  retry: false
});
```

## Configuration Options

### AxiosRetryConfig Interface

```typescript
interface AxiosRetryConfig {
  /**
   * Number of times to retry the request (default: 3)
   */
  retries?: number;

  /**
   * Delay function that receives attempt number and returns delay in milliseconds.
   * Default: (attempt) => attempt * 100
   */
  delay?: (attempt: number) => number;

  /**
   * Custom predicate to determine if a request should be retried.
   * Receives the error and attempt number.
   */
  shouldRetry?: (error: AxiosError, attempt: number) => boolean;
}
```

## Backoff Strategies

### 1. Default Linear Backoff

The default delay function uses linear backoff: `100ms, 200ms, 300ms, ...`

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 3
    // Uses default: (attempt) => attempt * 100
  }
});
```

### 2. Exponential Backoff

Exponential backoff increases delay exponentially, useful for distributed systems:

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 100
    // Delays: 200ms, 400ms, 800ms, 1600ms, 3200ms
  }
});
```

### 3. Exponential Backoff with Jitter

Adds randomness to prevent thundering herd problem:

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => {
      const baseDelay = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * baseDelay * 0.1; // 10% jitter
      return baseDelay + jitter;
    }
  }
});
```

### 4. Capped Linear Backoff

Linear backoff with a maximum delay cap:

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.min(5000, attempt * 1000)
    // Delays: 1s, 2s, 3s, 4s, 5s (capped at 5s)
  }
});
```

## Custom Retry Predicates

### Default Retry Behavior

By default, Axios retries on:
- Network errors (`ERR_NETWORK`, `ECONNABORTED`, `ETIMEDOUT`)
- 5xx server errors (500, 502, 503, 504, etc.)
- 429 (Too Many Requests - rate limiting)

### Custom Predicate for Rate Limiting

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 10,
    delay: (attempt) => attempt * 1000,
    shouldRetry: (error, attempt) => {
      // Only retry on rate limit or network errors
      if (error.response?.status === 429) {
        console.log(`Rate limited, retrying in ${attempt * 1000}ms...`);
        return true;
      }
      if (error.code === 'ERR_NETWORK' || error.code === 'ETIMEDOUT') {
        return true;
      }
      return false;
    }
  }
});
```

### Custom Predicate for Specific Status Codes

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 3,
    shouldRetry: (error, attempt) => {
      const retryableStatuses = [408, 429, 500, 502, 503, 504];
      return error.response?.status && retryableStatuses.includes(error.response.status);
    }
  }
});
```

## Global Configuration

Set default retry configuration for all requests:

```javascript
// Set global defaults
axios.defaults.retry = {
  retries: 3,
  delay: (attempt) => attempt * 100
};

// Individual requests can still override
axios.get('/api/endpoint', {
  retry: {
    retries: 5 // Override global setting
  }
});
```

## Advanced Examples

### Retry with Logging

```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 3,
    delay: (attempt) => {
      const delay = attempt * 100;
      console.log(`Waiting ${delay}ms before retry attempt ${attempt}...`);
      return delay;
    },
    shouldRetry: (error, attempt) => {
      console.log(`Attempt ${attempt} failed:`, error.message);
      return error.code === 'ERR_NETWORK' || error.response?.status >= 500;
    }
  }
});
```

### Retry with Exponential Backoff and Max Delay

```javascript
const exponentialWithCap = (attempt) => {
  const delay = Math.pow(2, attempt) * 100;
  return Math.min(delay, 30000); // Cap at 30 seconds
};

axios.get('/api/endpoint', {
  retry: {
    retries: 10,
    delay: exponentialWithCap
  }
});
```

### Retry with Circuit Breaker Pattern

```javascript
let failureCount = 0;

axios.get('/api/endpoint', {
  retry: {
    retries: 3,
    shouldRetry: (error, attempt) => {
      if (error.response?.status >= 500) {
        failureCount++;
        if (failureCount > 5) {
          console.log('Circuit breaker opened - stopping retries');
          return false;
        }
        return true;
      }
      failureCount = 0;
      return false;
    }
  }
});
```

## Error Handling

When all retries are exhausted, the original error is thrown:

```javascript
try {
  const response = await axios.get('/api/endpoint', {
    retry: {
      retries: 3
    }
  });
} catch (error) {
  console.error('Request failed after 3 retries:', error.message);
  console.error('Status:', error.response?.status);
}
```

## Performance Considerations

### Delay Function Optimization

Keep delay functions simple and fast:

```javascript
// Good - simple calculation
delay: (attempt) => attempt * 100

// Avoid - expensive operations
delay: (attempt) => {
  // Don't do expensive computations here
  const result = expensiveCalculation();
  return result;
}
```

### Maximum Retry Count

Consider the trade-off between reliability and latency:

```javascript
// For critical operations
retry: { retries: 5 }

// For non-critical operations
retry: { retries: 2 }

// For real-time operations
retry: { retries: 1 }
```

## TypeScript Support

Full TypeScript support is included:

```typescript
import axios, { AxiosRetryConfig } from 'axios';

const retryConfig: AxiosRetryConfig = {
  retries: 3,
  delay: (attempt: number) => attempt * 100,
  shouldRetry: (error, attempt) => {
    return error.code === 'ERR_NETWORK';
  }
};

axios.get('/api/endpoint', { retry: retryConfig });
```

## Common Patterns

### Pattern 1: REST API with Rate Limiting

```javascript
axios.get('/api/data', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 1000,
    shouldRetry: (error) => error.response?.status === 429
  }
});
```

### Pattern 2: Microservices with Exponential Backoff

```javascript
axios.post('/api/service', data, {
  retry: {
    retries: 4,
    delay: (attempt) => {
      const baseDelay = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * baseDelay * 0.1;
      return baseDelay + jitter;
    }
  }
});
```

### Pattern 3: Polling with Backoff

```javascript
async function pollEndpoint() {
  return axios.get('/api/status', {
    retry: {
      retries: 10,
      delay: (attempt) => Math.min(attempt * 1000, 30000)
    }
  });
}
```

## Backward Compatibility

The retry feature is **disabled by default** (`retry: false`), ensuring complete backward compatibility with existing code. Enable it explicitly when needed.

## Implementation Details

### Retry Helper Module

The retry logic is implemented in `lib/helpers/retryHelper.js` with three main functions:

- `normalizeRetryConfig()` - Validates and normalizes retry configuration
- `shouldRetryRequest()` - Determines if a request should be retried
- `executeWithRetry()` - Executes requests with retry logic

### Integration Points

- **dispatchRequest.js** - Wraps adapter calls with retry logic
- **defaults/index.js** - Provides default retry configuration
- **index.d.ts** - TypeScript type definitions

## Troubleshooting

### Retries Not Working

1. Check that `retry` is not set to `false`
2. Verify the error matches the retry predicate
3. Check that `retries` count is greater than 0

### Too Many Retries

1. Reduce the `retries` count
2. Increase the `delay` to avoid overwhelming the server
3. Use a custom `shouldRetry` predicate to be more selective

### Performance Issues

1. Reduce the number of retries
2. Decrease the delay between retries
3. Use a custom predicate to avoid retrying non-retryable errors

## See Also

- [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Retry Strategies](https://en.wikipedia.org/wiki/Exponential_backoff)
