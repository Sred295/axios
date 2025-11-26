describe('debug option', function () {
  let originalConsoleLog;
  let logOutput;

  beforeEach(function () {
    jasmine.Ajax.install();
    originalConsoleLog = console.log;
    logOutput = [];
    console.log = function (...args) {
      logOutput.push(args.join(' '));
    };
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    console.log = originalConsoleLog;
    logOutput = [];
  });

  it('should not log when debug is not set', function (done) {
    axios('/foo');

    getAjaxRequest().then(function (request) {
      expect(logOutput.length).toBe(0);
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should not log when debug is false', function (done) {
    axios('/foo', { debug: false });

    getAjaxRequest().then(function (request) {
      expect(logOutput.length).toBe(0);
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should log request details when debug is true', function (done) {
    axios('/foo', { debug: true });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('=== Axios Request Debug ===');
      expect(logText).toContain('Method: GET');
      expect(logText).toContain('URL: /foo');
      expect(logText).toContain('Headers:');
      expect(logText).toContain('Equivalent curl command:');
      expect(logText).toContain('=== End Request Debug ===');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should log POST request with data when debug is true', function (done) {
    axios.post('/foo', { name: 'test' }, { debug: true });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('Method: POST');
      expect(logText).toContain('URL: /foo');
      expect(logText).toContain('Data:');
      expect(logText).toContain('name');
      expect(logText).toContain('test');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should log custom headers when debug is true', function (done) {
    axios('/foo', {
      debug: true,
      headers: {
        'Custom-Header': 'custom-value',
        'User-Agent': 'Mozilla/5.0'
      }
    });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('Custom-Header: custom-value');
      expect(logText).toContain('User-Agent: Mozilla/5.0');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should use custom logger function when provided', function (done) {
    const customLogger = jasmine.createSpy('customLogger');
    
    axios('/foo', { debug: customLogger });

    getAjaxRequest().then(function (request) {
      expect(customLogger).toHaveBeenCalled();
      const calls = customLogger.calls.all();
      expect(calls.length).toBeGreaterThan(0);
      const logText = calls.map(call => call.args[0]).join('\n');
      expect(logText).toContain('=== Axios Request Debug ===');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should log full URL with baseURL when debug is true', function (done) {
    axios('/bar', {
      baseURL: 'https://api.example.com',
      debug: true
    });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('URL: https://api.example.com/bar');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should log URL with query parameters when debug is true', function (done) {
    axios('/foo', {
      params: { id: 123, name: 'test' },
      debug: true
    });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('URL: /foo');
      expect(logText).toContain('id');
      expect(logText).toContain('123');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should format FormData correctly when debug is true', function (done) {
    const formData = new FormData();
    formData.append('field', 'value');

    axios.post('/foo', formData, { debug: true });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('[FormData]');
      request.respondWith({
        status: 200
      });
      done();
    });
  });

  it('should format different HTTP methods correctly', function (done) {
    const methods = ['get', 'post', 'put', 'patch', 'delete'];
    let completed = 0;

    methods.forEach(function (method) {
      axios[method]('/foo', { debug: true }).catch(function () {});

      getAjaxRequest().then(function (request) {
        const logText = logOutput.join('\n');
        expect(logText).toContain(`Method: ${method.toUpperCase()}`);
        request.respondWith({
          status: 200
        });
        completed++;
        if (completed === methods.length) {
          done();
        }
      });
    });
  });

  it('should include curl command in debug output', function (done) {
    axios('/foo', {
      debug: true,
      headers: {
        'Authorization': 'Bearer token123'
      }
    });

    getAjaxRequest().then(function (request) {
      const logText = logOutput.join('\n');
      expect(logText).toContain('curl -X GET');
      expect(logText).toContain("'Authorization: Bearer token123'");
      request.respondWith({
        status: 200
      });
      done();
    });
  });
});

