# Axios Retry Feature Overview

## 🎯 What's New

Axios now supports **customizable retry with backoff strategies** for failed requests. This feature helps handle transient failures, rate limiting, and network issues gracefully.

## 🚀 Quick Example

```javascript
import axios from 'axios';

// Retry with exponential backoff
const response = await axios.get('/api/data', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 100  // 200ms, 400ms, 800ms...
  }
});
```

## 📋 Features

- **Customizable Retry Count** - Configure how many times to retry (default: 3)
- **Flexible Delay Functions** - Implement any backoff strategy (linear, exponential, etc.)
- **Smart Retry Logic** - Automatically retries network errors, 5xx errors, and rate limits
- **Custom Predicates** - Fine-grained control over which errors to retry
- **Global Defaults** - Set retry configuration for all requests
- **TypeScript Support** - Full type safety with `AxiosRetryConfig` interface
- **Backward Compatible** - Disabled by default, no breaking changes

## 🎓 Use Cases

### 1. Handle Rate Limiting (429)
```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 10,
    delay: (attempt) => attempt * 1000,
    shouldRetry: (error) => error.response?.status === 429
  }
});
```

### 2. Exponential Backoff for Microservices
```javascript
axios.post('/api/service', data, {
  retry: {
    retries: 4,
    delay: (attempt) => Math.pow(2, attempt) * 100
  }
});
```

### 3. Jittered Backoff (Distributed Systems)
```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => {
      const base = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * base * 0.1;
      return base + jitter;
    }
  }
});
```

### 4. Global Configuration
```javascript
// Set for all requests
axios.defaults.retry = {
  retries: 3,
  delay: (attempt) => attempt * 100
};
```

## 📚 Documentation

- **[RETRY_QUICK_START.md](./RETRY_QUICK_START.md)** - Quick reference and examples
- **[RETRY_GUIDE.md](./RETRY_GUIDE.md)** - Comprehensive guide with patterns
- **[RETRY_IMPLEMENTATION.md](./RETRY_IMPLEMENTATION.md)** - Technical details
- **[examples/retry-backoff.js](./examples/retry-backoff.js)** - 10+ working examples

## 🧪 Testing

Comprehensive test suite included:
```bash
npm test -- test/specs/retry.spec.js
```

Tests cover:
- Configuration validation
- Retry predicates
- Delay functions
- Error handling
- Edge cases

## ⚙️ Configuration

### Basic Options

```typescript
interface AxiosRetryConfig {
  retries?: number;                              // Default: 3
  delay?: (attempt: number) => number;           // Default: linear backoff
  shouldRetry?: (error: AxiosError, attempt: number) => boolean;
}
```

### Default Retry Behavior

**Retries automatically on:**
- Network errors (`ERR_NETWORK`, `ECONNABORTED`, `ETIMEDOUT`)
- Server errors (5xx status codes)
- Rate limiting (429 status code)

**Does NOT retry on:**
- Client errors (4xx, except 429)
- Successful responses (2xx)
- Canceled requests

## 🔄 Backoff Strategies

### Linear Backoff (Default)
```javascript
delay: (attempt) => attempt * 100  // 100ms, 200ms, 300ms...
```

### Exponential Backoff
```javascript
delay: (attempt) => Math.pow(2, attempt) * 100  // 200ms, 400ms, 800ms...
```

### Capped Linear Backoff
```javascript
delay: (attempt) => Math.min(attempt * 1000, 5000)  // Max 5 seconds
```

### Jittered Exponential Backoff
```javascript
delay: (attempt) => {
  const base = Math.pow(2, attempt) * 100;
  const jitter = Math.random() * base * 0.1;
  return base + jitter;
}
```

## 🛡️ Error Handling

```javascript
try {
  const response = await axios.get('/api/data', {
    retry: { retries: 3 }
  });
} catch (error) {
  console.error('Failed after 3 retries:', error.message);
  console.error('Status:', error.response?.status);
}
```

## 💡 Best Practices

✅ **DO:**
- Use exponential backoff for distributed systems
- Add jitter to prevent thundering herd
- Set reasonable max delays
- Use custom predicates for specific error handling
- Test your retry configuration

❌ **DON'T:**
- Retry on all errors (use custom predicates)
- Use very high retry counts
- Use very short delays (can overwhelm servers)
- Perform expensive operations in delay functions

## 🔧 Implementation Details

### Files Modified
- `lib/core/dispatchRequest.js` - Integrated retry wrapper
- `lib/defaults/index.js` - Added default retry config
- `index.d.ts` - Added TypeScript definitions

### Files Created
- `lib/helpers/retryHelper.js` - Retry logic engine
- `test/specs/retry.spec.js` - Test suite
- `examples/retry-backoff.js` - Examples
- Documentation files

### Integration Points
- Retry logic applies at adapter level
- Works with request/response interceptors
- Respects cancellation tokens
- Maintains error handling consistency

## 📊 Performance

| Scenario | Impact |
|----------|--------|
| Retry disabled (default) | Zero overhead |
| Retry enabled, no errors | Minimal overhead |
| Retry enabled, with retries | Configurable delays |

## ✅ Backward Compatibility

- ✅ Retry disabled by default
- ✅ No breaking changes
- ✅ No new required dependencies
- ✅ All existing code works unchanged
- ✅ Opt-in feature

## 🎯 Next Steps

1. **Read** [RETRY_QUICK_START.md](./RETRY_QUICK_START.md) for quick examples
2. **Review** [examples/retry-backoff.js](./examples/retry-backoff.js) for patterns
3. **Check** [RETRY_GUIDE.md](./RETRY_GUIDE.md) for comprehensive guide
4. **Run** tests with `npm test -- test/specs/retry.spec.js`

## 📞 Support

For questions or issues:
1. Check the quick start guide
2. Review the examples
3. Read the comprehensive guide
4. Check the test cases

---

**Status**: ✅ Ready for Production

**Backward Compatible**: ✅ Yes

**Breaking Changes**: ❌ None

**TypeScript Support**: ✅ Full
