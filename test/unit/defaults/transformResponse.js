import defaults from '../../../lib/defaults/index.js';
import transformData from '../../../lib/core/transformData.js';
import assert from 'assert';

describe('transformResponse', function () {
    describe('200 request', function () {
        it('parses json', function () {
            const data = '{"message": "hello, world"}';
            const result = transformData.call({
                data,
                response: {
                    headers: {'content-type': 'application/json'},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result.message, 'hello, world');
        });
        it('ignores XML', function () {
            const data = '<message>hello, world</message>';
            const result = transformData.call({
                data,
                response: {
                    headers: {'content-type': 'text/xml'},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
    describe('204 request', function () {
        it('does not parse the empty string', function () {
            const data = '';
            const result = transformData.call({
                data,
                response: {
                    headers: {'content-type': undefined},
                    status: 204
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, '');
        });
        it('does not parse undefined', function () {
            const data = undefined;
            const result = transformData.call({
                data,
                response: {
                    headers: {'content-type': undefined},
                    status: 200
                }
            }, defaults.transformResponse);
            assert.strictEqual(result, data);
        });
    });
    it('should throw a clear error message when JSON.parse fails on malformed JSON', function () {
        var malformed = '{"name" : "Aditya"';
        
        var config = {
            transitional: {
                forcedJSONParsing: true,
                silentJSONParsing: false
            },
            responseType: 'json',
            response: {}
        };

        assert.throws(function () {
            transformData(
                malformed,
                { 'content-type': 'application/json' },
                200,
                defaults.transformResponse.bind(config)
            );
        }, /Failed to prase JSON response\. Response was not valid JSON\./);  
    });
});
