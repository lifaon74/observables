const http = require('http');

class NetworkError {
  constructor(status, code, message) {
    this.status = status;
    this.code = code;
    this.message = message;
  }
}

function HandleRequest(cb) {
  return (request, response) => {
    new Promise(function(resolve) {
      resolve(cb(request, response));
    })
      .then(() => {
        response.end();
      }, (error) => {
        if (error instanceof NetworkError) {
          RespondWithError(response, error.status, error.code, error.message);
        } else if (error instanceof Error) {
          RespondWithError(response, 500, 'UNKNOWN', error.message);
        } else {
          RespondWithError(response, 500, 'UNKNOWN', String(error));
        }
      })
  };
}


function RespondWithError(response, status, code, message) {
  response.writeHead(status, { 'Content-Type': 'application/json' });
  response.write(JSON.stringify({
    code: code,
    message: message
  }));
  response.end();
}

function ProxyHTTP(url, proxyRequest, proxyResponse) {
  return new Promise(function(resolve, reject) {
    const headers = proxyRequest.headers;
    delete headers.host;

    const request = require(url.protocol.slice(0, -1))
      .request(url, {
        method: proxyRequest.method,
        headers: headers
      }, (response) => {
        proxyResponse.writeHead(response.statusCode, Object.assign({}, response.headers, { 'Access-Control-Allow-Origin': '*' }));

        // response.pipe(proxyResponse)
        response.on('data', (chunk) => {
          proxyResponse.write(chunk);
        });

        response.on('end', () => {
          resolve();
        });
      });

    request.on('error', (error) => {
      console.log(error);
      reject(new NetworkError(500, 'INVALID_QUERY', error.message));
    });

    proxyRequest.on('data', (chunk) => {
      // console.log('receive');
      // console.log(chunk);
      request.write(chunk);
    });

    proxyRequest.on('end', () => {
      request.end();
    });
  });
}


const proxy = http.createServer(HandleRequest((proxyRequest, proxyResponse) => {
  return new Promise(function(resolve) {
    // console.log(Object.keys(proxyRequest));
    const requestURL = new URL(proxyRequest.url, 'http://localhost');
    if (requestURL.searchParams.has('url')) {
      const url = new URL(requestURL.searchParams.get('url'));
      switch (url.protocol) {
        case 'http:':
        case 'https:':
          resolve(ProxyHTTP(url, proxyRequest, proxyResponse));
          break;
        default:
          throw new NetworkError(400, 'UNSUPPORTED_PROTOCOL', `Protocol ${requestURL.protocol} is not supported`);
      }
    } else {
      throw new NetworkError(400, 'INVALID_QUERY', 'Missing query param url');
    }
  });
}));


proxy.listen(1337);