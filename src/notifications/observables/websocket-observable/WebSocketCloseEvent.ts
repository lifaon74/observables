export class WebSocketError extends Error {
  // https://stackoverflow.com/questions/18803971/websocket-onerror-how-to-read-error-description

  static codeToReason(code: number): string {
    switch (code) {
      case 1000:
        return 'Normal closure';
      case 1001:
        return 'Endpoint is "going away", such as a server going down or a browser having navigated away from a page';
      case 1002:
        return 'Endpoint terminated the connection due to a protocol error';
      case 1003:
        return 'Endpoint terminated the connection due to non accepted data type';
      case 1004:
        return 'Reserved';
      case 1005:
        return 'No status code';
      case 1006:
        return 'The connection was closed abnormally, e.g., without sending or receiving a Close control frame';
      case 1007:
        return 'Endpoint terminated the connection because it has received data within a message that was not consistent with the type of the message';
      case 1008:
        return 'Endpoint terminated the connection because it has received a message that "violates its policy"';
      case 1009:
        return 'Endpoint terminated the connection because it has received a message that is too big for it to process';
      case 1010:
        return 'Client terminated the connection because it has expected the server to negotiate one or more extension, but the server didn\'t return them in the response message of the WebSocket handshake';
      case 1011:
        return 'Server is terminating the connection because it encountered an unexpected condition that prevented it from fulfilling the request';
      case 1015:
        return 'The connection was closed due to a failure to perform a TLS handshake';
      default:
        return 'Unknown reason';
    }
  }

  readonly code: number;

  constructor(code: number) {
    super(WebSocketError.codeToReason(code));
    this.code = code;
    this.name = 'WebSocketCloseError';
  }
}
