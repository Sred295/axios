import utils from '../../utils.js'
import URLSearchParams from './classes/URLSearchParams.js'
import FormData from './classes/FormData.js'

const ALPHA = 'abcdefghijklmnopqrstuvwxyz'

const DIGIT = '0123456789';

const ALPHABET = {
  DIGIT,
  ALPHA,
  ALPHA_DIGIT: ALPHA + ALPHA.toUpperCase() + DIGIT
}

const getRandomValues = (array) => {
  if (
    typeof utils.global === 'object' &&
    typeof utils.global.crypto === 'object' &&
    typeof utils.global.crypto.getRandomValues === 'function'
  ) {
    return utils.global.crypto.getRandomValues(array);
  }

  if (typeof require === 'function') {
    try {
      const nodeCrypto = require('crypto');
      return nodeCrypto.getRandomValues(array);
    } catch (e) {}
  }
}

const generateString = (size = 16, alphabet = ALPHABET.ALPHA_DIGIT) => {
  let str = '';
  const {length} = alphabet;
  const randomValues = new Uint32Array(size);
  getRandomValues(randomValues);
  for (let i = 0; i < size; i++) {
    str += alphabet[randomValues[i] % length];
  }

  return str;
}


export default {
  isNode: true,
  classes: {
    URLSearchParams,
    FormData,
    Blob: typeof Blob !== 'undefined' && Blob || null
  },
  ALPHABET,
  generateString,
  protocols: [ 'http', 'https', 'file', 'data' ]
};
