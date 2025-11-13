# Axios Retry - Quick Start Guide

## Installation

The retry feature is built-in to Axios. No additional installation needed.

## Quick Examples

### 1️⃣ Enable Retry (Default Settings)

```javascript
import axios from 'axios';

// Retry up to 3 times with linear backoff (100ms, 200ms, 300ms)
axios.get('/api/data', {
  retry: true
});
```

### 2️⃣ Custom Retry Count

```javascript
axios.get('/api/data', {
  retry: {
    retries: 5  // Retry up to 5 times
  }
});
```

### 3️⃣ Exponential Backoff

```javascript
axios.get('/api/data', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 100
    // Waits: 200ms, 400ms, 800ms, 1600ms, 3200ms
  }
});
```

### 4️⃣ Handle Rate Limiting (429)

```javascript
axios.get('/api/data', {
  retry: {
    retries: 10,
    delay: (attempt) => attempt * 1000,
    shouldRetry: (error) => error.response?.status === 429
  }
});
```

### 5️⃣ Global Default

```javascript
// Set for all requests
axios.defaults.retry = {
  retries: 3,
  delay: (attempt) => attempt * 100
};

// Override for specific request
axios.get('/api/data', {
  retry: { retries: 5 }
});
```

## Default Retry Behavior

**Retries automatically on:**
- Network errors (connection failed, timeout)
- Server errors (5xx status codes)
- Rate limiting (429 status code)

**Does NOT retry on:**
- Client errors (4xx, except 429)
- Successful responses (2xx)
- Canceled requests

## Common Patterns

### Pattern A: REST API with Rate Limiting
```javascript
axios.get('/api/endpoint', {
  retry: {
    retries: 5,
    delay: (attempt) => Math.pow(2, attempt) * 100,
    shouldRetry: (error) => error.response?.status === 429
  }
});
```

### Pattern B: Microservices
```javascript
axios.post('/api/service', data, {
  retry: {
    retries: 4,
    delay: (attempt) => {
      const base = Math.pow(2, attempt) * 100;
      const jitter = Math.random() * base * 0.1;
      return base + jitter;
    }
  }
});
```

### Pattern C: Polling
```javascript
axios.get('/api/status', {
  retry: {
    retries: 10,
    delay: (attempt) => Math.min(attempt * 1000, 30000)
  }
});
```

## API Reference

### Configuration Options

```typescript
{
  retry: {
    retries?: number,              // Default: 3
    delay?: (attempt) => number,   // Default: attempt * 100
    shouldRetry?: (error, attempt) => boolean
  }
}
```

### Delay Function

- Receives `attempt` number (1-based)
- Should return delay in milliseconds
- Default: `(attempt) => attempt * 100`

### Should Retry Predicate

- Receives `error` and `attempt` number
- Should return `true` to retry, `false` to fail
- Default: retries on network errors, 5xx, and 429

## Error Handling

```javascript
try {
  const response = await axios.get('/api/data', {
    retry: { retries: 3 }
  });
} catch (error) {
  console.error('Failed after 3 retries:', error.message);
}
```

## Disable Retry

```javascript
axios.get('/api/data', {
  retry: false  // No retries
});
```

## Tips & Best Practices

✅ **DO:**
- Use exponential backoff for distributed systems
- Add jitter to prevent thundering herd
- Set reasonable max delays
- Use custom predicates for specific error handling

❌ **DON'T:**
- Retry on all errors (use custom predicates)
- Use very high retry counts
- Use very short delays (can overwhelm servers)
- Perform expensive operations in delay functions

## Performance

- **Zero overhead** when retry is disabled (default)
- **Minimal overhead** when enabled
- **Configurable delays** - you control timing

## TypeScript Support

```typescript
import axios, { AxiosRetryConfig } from 'axios';

const config: AxiosRetryConfig = {
  retries: 3,
  delay: (attempt) => attempt * 100
};

axios.get('/api/data', { retry: config });
```

## More Information

- See `RETRY_GUIDE.md` for comprehensive documentation
- See `examples/retry-backoff.js` for 10+ examples
- See `test/specs/retry.spec.js` for test cases

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Retries not working | Check `retry` is not `false` and error matches predicate |
| Too many retries | Reduce `retries` count or use custom `shouldRetry` |
| Slow requests | Reduce `delay` or use custom predicate to be selective |
| Memory issues | Reduce retry count and delay values |

---

**Need help?** Check the full guide in `RETRY_GUIDE.md`
