import CanceledError from "../cancel/CanceledError.js";
import AxiosError from "../core/AxiosError.js";
import utils from '../utils.js';
import transitionalDefaults from "../defaults/transitional.js";

const composeSignals = (signals, timeout, options = {}) => {
  const {length} = (signals = signals ? signals.filter(Boolean) : []);

  if (timeout || length) {
    let controller = new AbortController();

    let aborted;

    const onabort = function (reason) {
      if (!aborted) {
        aborted = true;
        unsubscribe();
        const err = reason instanceof Error ? reason : this.reason;
        controller.abort(err instanceof AxiosError ? err : new CanceledError(err instanceof Error ? err.message : err));
      }
    }

    let timer = timeout && setTimeout(() => {
      timer = null;

      const {
        transitional = transitionalDefaults,
        timeoutErrorMessage
      } = options || {};

      const message = timeoutErrorMessage || (timeout ? `timeout of ${timeout}ms exceeded` : 'timeout exceeded');

      onabort(new AxiosError(
        message,
        transitional && transitional.clarifyTimeoutError ? AxiosError.ETIMEDOUT : AxiosError.ECONNABORTED
      ))
    }, timeout)

    const unsubscribe = () => {
      if (signals) {
        timer && clearTimeout(timer);
        timer = null;
        signals.forEach(signal => {
          signal.unsubscribe ? signal.unsubscribe(onabort) : signal.removeEventListener('abort', onabort);
        });
        signals = null;
      }
    }

    signals.forEach((signal) => signal.addEventListener('abort', onabort));

    const {signal} = controller;

    signal.unsubscribe = () => utils.asap(unsubscribe);

    return signal;
  }
}

export default composeSignals;
