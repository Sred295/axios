/**
 * Checks a given URL string for common path traversal sequences (`../` or `..\`).
 *
 * This function is a security measure to help prevent directory traversal attacks
 * by throwing an error if potentially malicious path components are found directly
 * within the URL string.
 * 
 * @param {string} finalUrl URL
 *
 * @returns {string} safe URL
 **/
export default function checkTraversalPathUrl(finalUrl) {
  let decodedUrl = decodeURIComponent(finalUrl);

  if (decodedUrl.includes('../') || decodedUrl.includes('..\\')) {
    throw new Error('Security Error: Path traversal attempt detected in URL.');
  }

  return finalUrl;
}