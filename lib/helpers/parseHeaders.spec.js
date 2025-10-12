/* eslint-env mocha */
import { expect } from 'chai';
import parseHeaders from './parseHeaders.js';

describe('parseHeaders', function () {
  it('should correctly parse Content-Disposition header', function () {
    const raw = [
      'Date: Wed, 27 Aug 2014 08:58:49 GMT',
      'Content-Type: application/json',
      'Content-Disposition: attachment; filename="data.json"',
      'Connection: keep-alive'
    ].join('\n');

    const parsed = parseHeaders(raw);

    expect(parsed['content-disposition']).to.equal('attachment; filename="data.json"');
  });
});
