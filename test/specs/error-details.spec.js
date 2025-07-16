/* eslint-env mocha */
'use strict';

const https     = require('https');
const net       = require('net');
const fs        = require('fs');
const path      = require('path');
const axios     = require('../../../index');   // <‑‑ three levels up from test/unit/adapters
const { expect } = require('chai');

/**
 * Spin up a throw‑away TCP server solely to obtain an unused port.
 * Once it’s closed, connecting to that port is guaranteed to trigger ECONNREFUSED.
 */
function getClosedPort () {
  return new Promise(resolve => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

describe('adapters – network‑error details', function () {
  // CI can be a bit slow starting/stopping HTTPS servers
  this.timeout(5000);

  it('surfaces ECONNREFUSED & originalError on connection refusal', async () => {
    const port = await getClosedPort();

    try {
      await axios.get(`http://127.0.0.1:${port}`, { timeout: 500 });
      throw new Error('request unexpectedly succeeded');
    } catch (err) {
      expect(err).to.be.instanceof(Error);
      expect(err.isAxiosError).to.equal(true);

      // new behaviour
      expect(err.code).to.equal('ECONNREFUSED');
      expect(err.originalError).to.exist;

      // message should now include the low‑level code
      expect(err.message).to.match(/ECONNREFUSED/);
    }
  });

  it('surfaces self‑signed TLS error & originalError', async () => {
    // Paths assume the cert/key from existing adapter tests sit in the same folder.
    const keyPath  = path.join(__dirname, 'selfsigned.key');
    const certPath = path.join(__dirname, 'selfsigned.crt');

    const httpsServer = https.createServer({
      key : fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath)
    }, (req, res) => res.end('ok'));

    await new Promise(res => httpsServer.listen(0, '127.0.0.1', res));
    const { port } = httpsServer.address();

    try {
      await axios.get(`https://127.0.0.1:${port}`, {
        timeout: 500,
        // default agent rejects self‑signed certs, but make it explicit
        httpsAgent: new https.Agent({ rejectUnauthorized: true })
      });
      throw new Error('request unexpectedly succeeded');
    } catch (err) {
      // Node versions vary: SELF_SIGNED_CERT_IN_CHAIN, DEPTH_ZERO_SELF_SIGNED_CERT,
      // or UNABLE_TO_VERIFY_LEAF_SIGNATURE once the chain is missing.
      expect(err.code).to.match(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE/);
      expect(err.originalError).to.exist;
      expect(err.message).to.match(/SELF_SIGNED|UNABLE_TO_VERIFY_LEAF_SIGNATURE/);
    } finally {
      httpsServer.close();
    }
  });
});
