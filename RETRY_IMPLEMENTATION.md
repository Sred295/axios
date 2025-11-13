# Retry Implementation Summary

## Overview

This document summarizes the implementation of customizable retry with backoff strategies for Axios.

## Changes Made

### 1. New Retry Helper Module
**File**: `lib/helpers/retryHelper.js`

Provides three main functions:

- **`normalizeRetryConfig(retryConfig)`**
  - Validates and normalizes retry configuration
  - Supports `true` (default settings), `false` (disabled), or configuration object
  - Returns normalized config with `retries`, `delay`, and `shouldRetry` properties

- **`shouldRetryRequest(error, attempt, shouldRetry)`**
  - Determines if a request should be retried based on error
  - Default behavior: retries on network errors, 5xx status codes, and 429 (rate limit)
  - Supports custom predicates via `shouldRetry` parameter

- **`executeWithRetry(requestFn, retryConfig)`**
  - Executes a request function with retry logic
  - Handles delays between retries
  - Gracefully handles invalid delay functions

### 2. TypeScript Definitions
**File**: `index.d.ts`

Added new interface:
```typescript
export interface AxiosRetryConfig {
  retries?: number;
  delay?: (attempt: number) => number;
  shouldRetry?: (error: AxiosError, attempt: number) => boolean;
}
```

Updated `AxiosRequestConfig` to include:
```typescript
retry?: boolean | AxiosRetryConfig;
```

### 3. Integration with dispatchRequest
**File**: `lib/core/dispatchRequest.js`

- Imported `retryHelper`
- Normalized retry config from request configuration
- Wrapped adapter call with `executeWithRetry()`
- Maintains all existing error handling and transformations

### 4. Default Configuration
**File**: `lib/defaults/index.js`

Added default retry setting:
```javascript
retry: false
```

Retry is disabled by default for backward compatibility.

### 5. Comprehensive Tests
**File**: `test/specs/retry.spec.js`

Test coverage includes:
- Configuration normalization
- Retry predicates (network errors, status codes, custom)
- Retry execution with various scenarios
- Delay function handling
- Edge cases and error handling

### 6. Examples
**File**: `examples/retry-backoff.js`

Demonstrates 10 different usage patterns:
1. Basic retry with default settings
2. Exponential backoff
3. Linear backoff with cap
4. Custom retry predicate for rate limiting
5. Jittered exponential backoff
6. Simple retry flag
7. Disabled retry
8. Global default configuration
9. Selective retry by status code
10. Retry with logging

### 7. Documentation
**File**: `RETRY_GUIDE.md`

Comprehensive guide covering:
- Overview and use cases
- Basic usage
- Configuration options
- Backoff strategies (linear, exponential, jittered, capped)
- Custom retry predicates
- Global configuration
- Advanced examples
- Error handling
- Performance considerations
- TypeScript support
- Common patterns
- Troubleshooting

## API Usage

### Basic Usage

```javascript
// Simple retry with defaults
axios.get('/api/endpoint', {
  retry: true
});

// Custom retry configuration
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 100,
    shouldRetry: (error, attempt) => {
      return error.response?.status === 429 || error.code === 'ERR_NETWORK';
    }
  }
});
```

### Global Configuration

```javascript
// Set default retry for all requests
axios.defaults.retry = {
  retries: 3,
  delay: (attempt) => attempt * 100
};
```

## Backward Compatibility

✅ **Fully backward compatible**
- Retry is disabled by default (`retry: false`)
- No changes to existing request handling
- All existing code works without modification
- New feature is opt-in

## Default Retry Behavior

When retry is enabled without custom `shouldRetry`:

**Retries on:**
- Network errors: `ERR_NETWORK`, `ECONNABORTED`, `ETIMEDOUT`
- Server errors: Status codes 500-599
- Rate limiting: Status code 429

**Does NOT retry on:**
- Client errors: Status codes 400-499 (except 429)
- Successful responses: Status codes 200-299
- Canceled requests

## Performance Impact

- **No impact when retry is disabled** (default)
- **Minimal overhead when enabled**: Only adds retry logic wrapper
- **Configurable delays**: Developers control timing
- **Custom predicates**: Allows fine-grained control

## Testing

Run the retry tests:
```bash
npm test -- test/specs/retry.spec.js
```

## Files Modified/Created

### Created:
- `lib/helpers/retryHelper.js` - Retry logic implementation
- `test/specs/retry.spec.js` - Comprehensive test suite
- `examples/retry-backoff.js` - Usage examples
- `RETRY_GUIDE.md` - User documentation
- `RETRY_IMPLEMENTATION.md` - This file

### Modified:
- `lib/core/dispatchRequest.js` - Integrated retry logic
- `lib/defaults/index.js` - Added default retry config
- `index.d.ts` - Added TypeScript definitions

## Future Enhancements

Potential future improvements:
- Retry statistics/metrics
- Retry middleware for interceptors
- Built-in backoff strategies (exponential, fibonacci, etc.)
- Retry budget/quota system
- Distributed tracing support

## Notes

- The retry logic is applied at the adapter level (after request interceptors, before response interceptors)
- Retry does not affect request/response transformations
- Each retry attempt uses the same configuration
- Custom delay functions should return valid millisecond values
- The `shouldRetry` predicate can throw errors (treated as non-retryable)

## Support

For issues or questions about the retry feature:
1. Check `RETRY_GUIDE.md` for common patterns
2. Review examples in `examples/retry-backoff.js`
3. Check test cases in `test/specs/retry.spec.js`
