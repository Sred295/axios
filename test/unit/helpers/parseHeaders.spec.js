var parseHeaders = require('../../../lib/helpers/parseHeaders');
var assert = require('assert');

describe('parseHeaders - Content-Disposition', function () {
  it('should extract simple filename', function () {
    const result = parseHeaders('Content-Disposition: attachment; filename="test.txt"');
    assert.strictEqual(result['content-disposition'], 'test.txt');
  });

  it('should extract UTF-8 encoded filename', function () {
    const result = parseHeaders("Content-Disposition: attachment; filename*=UTF-8''résumé.pdf");
    assert.strictEqual(result['content-disposition'], 'résumé.pdf');
  });
});
