'use strict';

import AxiosError from '../core/AxiosError.js';
import utils from '../utils.js';

/**
 * A `CanceledError` is an object that is thrown when an operation is canceled.
 *
 * @param {string=} message The message.
 * @param {Object=} config The config.
 * @param {Object=} request The request.
 *
 * @returns {CanceledError} The created error.
 */
function CanceledError(message, config, request) {
  // eslint-disable-next-line no-eq-null,eqeqeq
  AxiosError.call(this, message == null ? 'canceled' : message, AxiosError.ERR_CANCELED, config, request);
  this.name = 'CanceledError';

  //Clone the config to break cyclic references
  if(config && typeof config === 'object') {
    this.config = { ...config };

    //If cancelToken exists , clone it and remove the 'reason' property to break the cycle.
    if(this.config.cancelToken && typeof this.config.cancelToken === 'object') {
      this.config.cancelToken = { ...this.config.cancelToken };
      if(this.config.cancelToken.reason) {
        delete this.config.cancelToken.reason;
      }
    }
  } else {
    this.config = config;
  }
}

utils.inherits(CanceledError, AxiosError, {
  __CANCEL__: true
});

export default CanceledError;
