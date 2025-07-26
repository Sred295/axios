/* eslint-env mocha */
'use strict';

var https = require('https');
var net = require('net');
var fs = require('fs');
var path = require('path');
var axios = require('../../../index');
var expect = require('chai').expect;

/**
 * Spin up a throw‑away TCP server solely to obtain an unused port.
 * Once it’s closed, connecting to that port is guaranteed to trigger ECONNREFUSED.
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

describe('adapters – network‑error details', function() {
  // CI can be a bit slow starting/stopping HTTPS servers
  this.timeout(5000);

  it('exposes ECONNREFUSED & sets error.cause on connection refusal', function() {
    return getClosedPort().then(function(port) {
      return axios.get('http://127.0.0.1:' + port, { timeout: 500 })
        .then(function() {
          throw new Error('request unexpectedly succeeded');
        })
        .catch(function(err) {
          expect(err).to.be.instanceof(Error);
          expect(err.isAxiosError).to.equal(true);

          // new behaviour
          expect(err.code).to.equal('ECONNREFUSED');
          expect(err).to.have.property('cause');
          expect(err.cause).to.be.instanceof(Error);
          // underlying Node error should carry the same code
          expect(err.cause && err.cause.code).to.equal('ECONNREFUSED');

          // message remains the historical string; do NOT assert it includes the code
          expect(err.message).to.be.a('string');
        });
    });
  });

  it('exposes self‑signed TLS error & sets error.cause', function() {
    var keyPath = path.join(__dirname, 'selfsigned.key');
    var certPath = path.join(__dirname, 'selfsigned.crt');

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
          // default agent rejects self‑signed certs, but make it explicit
          httpsAgent: new https.Agent({ rejectUnauthorized: true })
        })
          .then(function() {
            throw new Error('request unexpectedly succeeded');
          })
          .catch(function(err) {
            // Node/OpenSSL variants: SELF_SIGNED_CERT_IN_CHAIN, DEPTH_ZERO_SELF_SIGNED_CERT,
            // UNABLE_TO_VERIFY_LEAF_SIGNATURE, etc.
            expect(String(err.code)).to.match(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/);

            expect(err).to.have.property('cause');
            expect(err.cause).to.be.instanceof(Error);
            expect(String(err.cause && err.cause.code)).to.match(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE|DEPTH_ZERO/);

            // message unchanged for back‑compat
            expect(err.message).to.be.a('string');
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
