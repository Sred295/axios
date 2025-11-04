# GitHub Copilot Instructions for Axios

This document provides coding guidelines and best practices for GitHub Copilot when working with the Axios HTTP client library.

## Project Overview

Axios is a promise-based HTTP client for the browser and Node.js. It provides a simple interface for making HTTP requests with features like request/response transformation, automatic JSON data transformation, request and response interception, and request cancellation.

## Architecture & Code Structure

### Core Components
- `/lib/axios.js` - Main entry point and factory function
- `/lib/core/` - Core functionality (Axios constructor, request dispatching, etc.)
- `/lib/adapters/` - Platform-specific adapters (XHR for browser, HTTP for Node.js)
- `/lib/helpers/` - Utility functions and helpers
- `/lib/platform/` - Platform-specific code (browser vs Node.js)
- `/lib/defaults/` - Default configurations
- `/lib/cancel/` - Request cancellation logic

### Key Patterns
- Factory pattern for creating Axios instances
- Adapter pattern for platform-specific HTTP implementations
- Promise-based API with async/await support
- Interceptor pattern for request/response transformation
- Configuration merging and inheritance

## Coding Standards

### JavaScript Style
- Use ES6+ features where appropriate
- Follow existing indentation (2 spaces)
- Use semicolons consistently
- Prefer `const` and `let` over `var`
- Use template literals for string interpolation
- Follow camelCase naming convention

### Code Organization
- Keep functions focused and single-purpose
- Use descriptive variable and function names
- Group related functionality in modules
- Export only what needs to be public
- Use consistent error handling patterns

### Testing
- Write comprehensive unit tests using Mocha
- Include both Node.js and browser tests
- Test error conditions and edge cases
- Use appropriate test utilities from `test/` directory
- Follow existing test structure and naming conventions

## Best Practices

### Request/Response Handling
- Always handle both success and error cases
- Use appropriate HTTP status code checking
- Implement proper timeout handling
- Consider request cancellation for long-running requests
- Use interceptors for common transformations

### Configuration
- Merge configurations properly using existing utilities
- Validate configuration options
- Provide sensible defaults
- Support both instance and global configurations
- Document configuration options clearly

### Error Handling
- Use Axios error objects consistently
- Preserve original error information
- Provide helpful error messages
- Handle network errors gracefully
- Support error transformation via interceptors

### Performance
- Minimize memory allocations in hot paths
- Reuse instances when possible
- Avoid unnecessary data transformations
- Consider request/response size limitations
- Implement efficient data streaming where applicable

## Platform Considerations

### Browser
- Use XMLHttpRequest for HTTP requests
- Handle CORS appropriately
- Support FormData and File uploads
- Consider CSP restrictions
- Handle browser-specific quirks

### Node.js
- Use native HTTP/HTTPS modules
- Support streams for large payloads
- Handle SSL/TLS certificates properly
- Consider proxy configurations
- Support various authentication methods

## Security Guidelines

- Validate all user inputs
- Sanitize URLs and headers
- Implement proper HTTPS handling
- Avoid exposing sensitive information in errors
- Follow secure coding practices
- Consider CSRF protection where applicable

## Common Patterns to Follow

### Creating Adapters
```javascript
export default function someAdapter(config) {
  return new Promise((resolve, reject) => {
    // Implementation
    const response = {
      data: responseData,
      status: request.status,
      statusText: request.statusText,
      headers: responseHeaders,
      config: config,
      request: request
    };
    settle(resolve, reject, response);
  });
}
```

### Configuration Merging
```javascript
import utils from '../utils.js';

const config = utils.merge(defaults, instanceDefaults, requestConfig);
```

### Error Creation
```javascript
import AxiosError from '../core/AxiosError.js';

throw new AxiosError('Request failed', 'NETWORK_ERROR', config, request, response);
```

## Files to Reference

When working on specific functionality, reference these key files:
- Configuration: `/lib/defaults/index.js`
- Core logic: `/lib/core/Axios.js`
- Utilities: `/lib/utils.js`
- Error handling: `/lib/core/AxiosError.js`
- Request dispatching: `/lib/core/dispatchRequest.js`

## Testing Requirements

- Run `npm test` before submitting changes
- Ensure both Node.js and browser tests pass
- Include tests for new functionality
- Verify TypeScript definitions are updated
- Check ESLint compliance with `npm run fix`

## Documentation

- Update relevant documentation for API changes
- Include JSDoc comments for public APIs
- Provide usage examples for new features
- Update TypeScript definitions when needed
- Follow existing documentation patterns

## Build Process

The project uses:
- Rollup for bundling
- Gulp for build tasks
- ESLint for linting
- Mocha for testing
- Karma for browser testing

Always ensure builds pass with `npm run build` before submitting changes.