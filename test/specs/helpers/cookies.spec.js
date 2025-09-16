import cookies from '../../../lib/helpers/cookies';

describe('helpers::cookies', function () {
  afterEach(function () {
    // Remove all the cookies
    const expires = Date.now() - (60 * 60 * 24 * 7);
    document.cookie.split(';').map(function (cookie) {
      return cookie.split('=')[0];
    }).forEach(function (name) {
      document.cookie = name + '=; expires=' + new Date(expires).toGMTString();
    });
  });

  it('should write cookies', async function () {
    await cookies.write('foo', 'baz');
    expect(document.cookie).toEqual('foo=baz');
  });

  it('should read cookies', async function () {
    await cookies.write('foo', 'abc');
    await cookies.write('bar', 'def');
    expect(await cookies.read('foo')).toEqual('abc');
    expect(await cookies.read('bar')).toEqual('def');
  });

  it('should remove cookies', async function () {
    await cookies.write('foo', 'bar');
    await cookies.remove('foo');
    expect(await cookies.read('foo')).toEqual(null);
  });

  it('should uri encode values', async function () {
    await cookies.write('foo', 'bar baz%');
    expect(document.cookie).toEqual('foo=bar%20baz%25');
  });
});
