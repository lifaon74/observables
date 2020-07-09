export type TParseFunction = (code: string) => any;


export function LoadScript(src: string): Promise<TParseFunction> {
  return new Promise<TParseFunction>((resolve: any, reject: any) => {
    const scriptElement: HTMLScriptElement = document.createElement('script');
    scriptElement.src = src;

    const clear = () => {
      scriptElement.removeEventListener('load', error);
      scriptElement.removeEventListener('error', error);
    };

    const load = () => {
      clear();
      resolve();
    };

    const error = () => {
      clear();
      reject(new URIError(`The script '${ src }' didn't load correctly.`));
    };

    scriptElement.addEventListener('load', load);
    scriptElement.addEventListener('error', error);

    document.head.appendChild(scriptElement);
  });
}

let LOAD_JS_PARSER_PROMISE: Promise<TParseFunction>;

export function LoadJSParser(): Promise<TParseFunction> {
  if (LOAD_JS_PARSER_PROMISE === void 0) {
    LOAD_JS_PARSER_PROMISE = LoadScript(`https://unpkg.com/cherow@1.6.9/dist/umd/cherow.min.js`)
      .then(() => {
        return (globalThis as any).cherow.parse;
      });
  }
  return LOAD_JS_PARSER_PROMISE;
}

