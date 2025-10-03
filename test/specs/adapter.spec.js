
describe('adapter', function () {
  beforeEach(function () {
    jasmine.Ajax.install();
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
  });

  it('should support custom adapter', function (done) {
    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          request.send(null);
        });
      }
    }).catch(done);

    getAjaxRequest().then(function(request) {
      expect(request.url).toBe('/bar');
      done();
    });
  });

  it('should execute adapter code synchronously', function (done) {
    let asyncFlag = false;
    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          expect(asyncFlag).toBe(false);
          request.send(null);
        });
      }
    }).catch(done);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });

  it('should execute adapter code asynchronously when interceptor is present', function (done) {
    let asyncFlag = false;

    axios.interceptors.request.use(function (config) {
      config.headers.async = 'async it!';
      return config;
    });

    axios('/foo', {
      adapter: function barAdapter(config) {
        return new Promise(function dispatchXhrRequest(resolve) {
          const request = new XMLHttpRequest();
          request.open('GET', '/bar');

          request.onreadystatechange = function () {
            resolve({
              config: config,
              request: request
            });
          };

          expect(asyncFlag).toBe(true);
          request.send(null);
        });
      }
    }).catch(done);

    asyncFlag = true;

    getAjaxRequest().then(function() {
      done();
    });
  });

  describe('retry (xhr)', function () {
    it('should retry 429 and succeed on second attempt', function (done) {
      let hit = 0;

      axios('/foo', {
        retry: { retries: 1, retryDelay: 0, backoff: 'fixed', jitter: 'none' }
      }).then(function (res) {
        expect(res.status).toBe(200);
        expect(hit).toBe(2);
        done();
      }).catch(done.fail);

      getAjaxRequest().then(function (request) {
        hit++;
        request.respondWith({ status: 429, responseText: 'Too Many Requests', responseHeaders: { 'Retry-After': '0' } });

        setTimeout(function () {
          getAjaxRequest().then(function (request2) {
            hit++;
            request2.respondWith({ status: 200, responseText: 'OK' });
          });
        }, 0);
      });
    });

    it('should cancel during backoff wait', function (done) {
      const controller = new AbortController();

      axios('/foo', {
        signal: controller.signal,
        retry: { retries: 2, retryDelay: 1000, backoff: 'fixed', jitter: 'none' }
      }).then(function () {
        done.fail('should not resolve');
      }).catch(function (err) {
        expect(axios.isCancel(err)).toBeTrue();
        done();
      });

      getAjaxRequest().then(function (request) {
        request.respondWith({ status: 503, responseText: 'Service Unavailable' });
        setTimeout(function(){ controller.abort(); }, 10);
      });
    });
  });
});
