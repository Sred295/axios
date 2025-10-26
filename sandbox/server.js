import fs from 'fs';
import url from 'url';
import path from 'path';
import http from 'http';

let server;

/**
 * Pipes a file to the HTTP response.
 *
 * @param {http.ServerResponse} res - The HTTP response object.
 * @param {string} file - The relative path to the file to be served.
 * @param {string} [type] - Optional MIME type for the response.
 */
function pipeFileToResponse(res, file, type) {
  if (type) {
    res.writeHead(200, {
      'Content-Type': type
    });
  }

  fs.createReadStream(path.join(path.resolve(), 'sandbox', file)).pipe(res);
}

/**
 * Handles API requests to /api.
 *
 * Collects request data, parses it as JSON, and returns a JSON response
 * containing the request URL, method, headers, and parsed data.
 *
 * @param {http.IncomingMessage} req - The HTTP request object.
 * @param {http.ServerResponse} res - The HTTP response object.
 */
function handleApiRequest(req, res) {
  let status;
  let result;
  let data = '';

  req.on('data', (chunk) => {
    data += chunk;
  });

  req.on('end', () => {
    try {
      status = 200;
      result = {
        url: req.url,
        data: data ? JSON.parse(data) : undefined,
        method: req.method,
        headers: req.headers
      };
    } catch (e) {
      console.error('Error:', e.message);
      status = 400;
      result = {
        error: e.message
      };
    }

    res.writeHead(status, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(result));
  });
}

/**
 * Handles incoming HTTP requests.
 *
 * Serves static files like index.html and axios.js, or routes API requests to
 * handleApiRequest. Responds with 404 for unrecognized paths.
 *
 * @param {http.IncomingMessage} req - The HTTP request object.
 * @param {http.ServerResponse} res - The HTTP response object.
 */
function requestHandler(req, res) {
  req.setEncoding('utf8');

  const parsed = url.parse(req.url, true);
  let pathname = parsed.pathname;

  console.log('[' + new Date() + ']', req.method, pathname);

  if (pathname === '/') {
    pathname = '/index.html';
  }

  switch (pathname) {
    case '/index.html':
      pipeFileToResponse(res, './client.html', 'text/html');
      break;

    case '/axios.js':
      // Try to serve the built axios from ../dist; if missing, serve a tiny fetch-based shim
      try {
        const distPath = path.join(path.resolve(), 'dist', 'axios.js');
        if (fs.existsSync(distPath)) {
          pipeFileToResponse(res, '../dist/axios.js', 'text/javascript');
        } else {
          // Lightweight shim for sandbox usage (returns Promise resolving to { data })
          res.writeHead(200, { 'Content-Type': 'text/javascript' });
          res.end("window.axios = function(options){ return fetch(options.url, { method: options.method||'GET', headers: options.headers, body: options.data ? JSON.stringify(options.data) : undefined }).then(async function(r){ var data; try { data = await r.json(); } catch(e){ data = await r.text(); } return { data: data, status: r.status, statusText: r.statusText, headers: {}, config: options }; }); };");
        }
      } catch (e) {
        res.writeHead(500);
        res.end('/* server error: ' + String(e.message) + ' */');
      }
      break;

    case '/axios.js.map':
      pipeFileToResponse(res, '../dist/axios.js.map', 'text/javascript');
      break;

    case '/footer.js':
      pipeFileToResponse(res, './footer.js', 'text/javascript');
      break;

    case '/api':
      handleApiRequest(req, res);
      break;

    default:
      res.writeHead(404);
      res.end('<h1>404 Not Found</h1>');
      break;
  }
}

const PORT = 3000;

// Create and start the HTTP server
server = http.createServer(requestHandler);

server.listen(PORT, () => {
  console.log(`Listening on localhost:${PORT}...`);
});

/**
 * Handles server errors, e.g., port already in use.
 *
 * @param {NodeJS.ErrnoException} error - The server error object.
 */
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.log(`Address localhost:${PORT} in use. Please retry when the port is available!`);
    server.close();
  }
});
