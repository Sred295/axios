'use strict';

import isAbsoluteURL from '../helpers/isAbsoluteURL.js';
import combineURLs from '../helpers/combineURLs.js';

/**
 * Creates a new URL by combining the baseURL with the requestedURL,
 * only when the requestedURL is not already an absolute URL.
 * If the requestURL is absolute, this function returns the requestedURL untouched.
 *
 * @param {string} baseURL The base URL
 * @param {string} requestedURL Absolute or relative URL to combine
 *
 * @returns {string} The combined full path
 */
export default function buildFullPath(baseURL, requestedURL, allowAbsoluteUrls = true) {
  // requestedURL is relative when it's not an absolute URL
  let isRelativeUrl = !isAbsoluteURL(requestedURL);
  // If a baseURL is provided, combine when the request is relative
  // or when absolute URLs are explicitly disabled (allowAbsoluteUrls === false).
  if (baseURL && (isRelativeUrl || allowAbsoluteUrls === false)) {
    return combineURLs(baseURL, requestedURL);
  }
  return requestedURL;
}
