/* eslint-env mocha */
'use strict';

var https = require('https');
var net = require('net');
var fs = require('fs');
var path = require('path');
var axios = require('../../../index');
var assert = require('assert');

/**
 * Get a port that will refuse connections: bind to a random port and close it.
 */
function getClosedPort() {
  return new Promise(function(resolve) {
    var srv = net.createServer();
    srv.listen(0, '127.0.0.1', function() {
      var address = srv.address();
      var port = address && address.port;
      srv.close(function() { resolve(port); });
    });
  });
}

describe('adapters – network-error details', function() {
  this.timeout(5000);

  it('exposes ECONNREFUSED and sets error.cause on connection refusal', function() {
    return getClosedPort().then(function(port) {
      return axios.get('http://127.0.0.1:' + port, { timeout: 500 })
        .then(function() {
          throw new Error('request unexpectedly succeeded');
        })
        .catch(function(err) {
          assert.ok(err instanceof Error, 'should be an Error');
          assert.strictEqual(err.isAxiosError, true, 'isAxiosError should be true');

          // Node error code is surfaced and original error is linked via cause
          assert.strictEqual(err.code, 'ECONNREFUSED');
          assert.ok('cause' in err, 'error.cause should exist');
          assert.ok(err.cause instanceof Error, 'cause should be an Error');
          assert.strictEqual(err.cause && err.cause.code, 'ECONNREFUSED');

          // Keep message stable for back-compat
          assert.strictEqual(typeof err.message, 'string');
        });
    });
  });

  it('exposes self-signed TLS error and sets error.cause', function() {
    var keyPath  = path.join(__dirname, 'key.pem');
    var certPath = path.join(__dirname, 'cert.pem');

    var httpsServer = https.createServer({
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }, function(req, res) { res.end('ok'); });

    return new Promise(function(resolve) {
      httpsServer.listen(0, '127.0.0.1', resolve);
    })
      .then(function() {
        var port = httpsServer.address().port;

        return axios.get('https://127.0.0.1:' + port, {
          timeout: 500,
          httpsAgent: new https.Agent({ rejectUnauthorized: true })
        })
          .then(function() {
            throw new Error('request unexpectedly succeeded');
          })
          .catch(function(err) {
            // OpenSSL/Node variants: SELF_SIGNED_CERT_IN_CHAIN, DEPTH_ZERO_SELF_SIGNED_CERT,
            // UNABLE_TO_VERIFY_LEAF_SIGNATURE, etc.
            var codeStr = String(err.code);
            assert.ok(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(codeStr), 'unexpected TLS code: ' + codeStr);

            assert.ok('cause' in err, 'error.cause should exist');
            assert.ok(err.cause instanceof Error, 'cause should be an Error');
            var causeCode = String(err.cause && err.cause.code);
            assert.ok(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/.test(causeCode), 'unexpected cause code: ' + causeCode);

            // Message unchanged for back-compat
            assert.strictEqual(typeof err.message, 'string');
          })
          .then(function() {
            httpsServer.close();
          }, function(e) {
            httpsServer.close();
            throw e;
          });
      });
  });
});
