import assert from 'assert';
import checkTraversalPathUrl from '../../../lib/helpers/checkTraversalPath.js'; // Assuming the function is in this path

describe('helpers::checkTraversalPathUrl', function () {

    it('should return the URL if no path traversal sequences are present', function () {
        const url = 'https://example.com/api/data/resource';
        assert.strictEqual(checkTraversalPathUrl(url), url, 'URL with no traversal should be returned as is');
    });

    it('should throw an error for URLs containing "../" sequence', function () {
        const url = 'https://example.com/api/data/../../../../etc/passwd';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for "../" traversal'
        );
    });

    it('should throw an error for URLs containing "..\\" sequence', function () {
        const url = 'https://example.com/api/data/..\\..\\..\\windows\\win.ini';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for "..\\" traversal'
        );
    });

    it('should throw an error for URLs containing mixed literal traversal sequences', function () {
        const url = 'https://example.com/api/data/../..\\etc/passwd';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for mixed literal traversal'
        );
    });

    it('should throw an error if traversal sequences are URL-encoded', function () {
        const url = 'https://api.example.com/data/%2E%2E%2F%2E%2E%2Fetc%2Fpasswd';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for URL-encoded traversal'
        );
    });

    it('should return an empty string for an empty URL', function () {
        const url = '';
        assert.strictEqual(checkTraversalPathUrl(url), url, 'Empty string should be returned as is');
    });

    it('should throw an error if traversal sequences are in query parameters', function () {
        const url = 'https://example.com/api?file=../../secret.txt';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for traversal in query params'
        );
    });

    it('should throw an error if traversal sequences are in the URL hash', function () {
        const url = 'https://example.com/page#section/../../config.json';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for traversal in hash'
        );
    });

    it('should throw an error if URL-encoded traversal sequences are in query parameters', function () {
        const url = 'https://example.com/api?file=%2E%2E%2F%2E%2E%2Fsecret.txt';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for URL-encoded traversal in query params'
        );
    });

    it('should throw an error if URL-encoded traversal sequences are in the URL hash', function () {
        const url = 'https://example.com/page#section/%2E%2E%2F%2E%2E%2Fconfig.json';
        assert.throws(() => checkTraversalPathUrl(url),
            (err) => err instanceof Error && err.message === 'Security Error: Path traversal attempt detected in URL.',
            'Should throw error for URL-encoded traversal in hash'
        );
    });

});
