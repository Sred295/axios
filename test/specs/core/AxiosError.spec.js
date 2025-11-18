import { expect } from 'chai';
import AxiosError from '../../../lib/core/AxiosError.js';

describe('core::AxiosError', function() {
  it('should create an Error with message, config, code, request, response, stack and isAxiosError', function() {
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);

    expect(error instanceof Error).to.be.true;
    expect(error.message).to.equal('Boom!');
    expect(error.config).to.deep.equal({ foo: 'bar' });
    expect(error.code).to.equal('ESOMETHING');
    expect(error.request).to.equal(request);
    expect(error.response).to.equal(response);
    expect(error.isAxiosError).to.be.true;
    expect(error.stack).to.exist;
  });

  it('should create an Error that can be serialized to JSON', function() {
    const request = { path: '/foo' };
    const response = { status: 200, data: { foo: 'bar' } };
    const error = new AxiosError('Boom!', 'ESOMETHING', { foo: 'bar' }, request, response);

    const json = error.toJSON();

    expect(json.message).to.equal('Boom!');
    expect(json.config).to.deep.equal({ foo: 'bar' });
    expect(json.code).to.equal('ESOMETHING');
    expect(json.request).to.deep.equal({ path: '/foo' });
    expect(json.response).to.deep.equal({ status: 200, data: { foo: 'bar' } }); // Update this assertion
  });

  it('should serialize an AxiosError without circular references', function() {
    const request = { method: 'GET' };
    const response = { status: 404, data: { error: 'Not Found' } };
    const error = new AxiosError('Test error', 'ERR_TEST', { url: 'http://example.com' }, request, response);

    const json = error.toJSON();

    expect(json.message).to.equal('Test error');
    expect(json.name).to.equal('AxiosError');
    expect(json.code).to.equal('ERR_TEST');
    expect(json.config).to.deep.equal({ url: 'http://example.com' });
    expect(json.request).to.deep.equal(request);
    expect(json.response).to.deep.equal(response);
  });


  it('should handle circular references in request and response', function() {
    const circularObject = {};
    circularObject.self = circularObject; // Create a circular reference

    const error = new AxiosError('Circular error', 'ERR_CIRCULAR', {}, circularObject, circularObject);

    const json = error.toJSON();

    expect(json.message).to.equal('Circular error');
    expect(json.name).to.equal('AxiosError');
    expect(json.code).to.equal('ERR_CIRCULAR');
    expect(json.request).to.deep.equal({ self: {} }); // Update this assertion
    expect(json.response).to.deep.equal({ self: {} }); // Update this assertion
  });

  it('should have status property when response was passed to the constructor', function() {
    const response = { status: 200 };
    const error = new AxiosError('Boom!', 'ESOMETHING', {}, {}, response);

    expect(error.response.status).to.equal(200);
  });

  it('should add config, config, request and response to error', function() {
    const config = { url: '/foo' };
    const request = { path: '/foo' };
    const response = { status: 200 };
    const error = new AxiosError('Boom!', 'ESOMETHING', config, request, response);

    expect(error.config).to.deep.equal(config);
    expect(error.request).to.deep.equal(request);
    expect(error.response).to.deep.equal(response);
  });

  it('should return error', function() {
    const error = new AxiosError('Boom!', 'ESOMETHING', {}, {}, {});
    expect(error).to.exist;
  });
});
