'use strict';

/**
 * Creates a new URL by combining the specified URLs
 *
 * @param {string} baseURL The base URL
 * @param {string} relativeURL The relative URL
 *
 * @returns {string} The combined URL
 */
export default function combineURLs(baseURL, relativeURL) {
  return relativeURL
    // Remove trailing slashes from baseURL and leading slashes from relativeURL
    ? baseURL.replace(/\/+$|^\s+|\s+$/g, '').replace(/\/+$/,'') + '/' + relativeURL.replace(/^\/+/, '')
    : baseURL;
}
