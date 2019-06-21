export type Callback<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;


export type WorkerCallback<TArgs extends any[] = any, TReturn = any> = Callback<TArgs, IWorkerCallbackReturnType | TReturn>;

export type InferWorkerCallbackArguments<CB extends WorkerCallback> = Parameters<CB>;

export type InferWorkerCallbackReturnType<CB extends WorkerCallback> =
  CB extends (...args: any[]) => infer TReturn
    ? TReturn extends {
      result: infer TResult;
      transferable?: Transferable[];
    }
    ? TResult
    : TReturn
    : never
  ;

export interface IWorkerCallbackReturnType {
  result: any;
  transferable?: Transferable[];
}


// const cb1 = () => {
//   return 1;
// };
//
// const cb2 = () => {
//   return { result: 1 };
// };
//
// const a: InferWorkerCallbackReturnType<typeof cb1>;
// const a: InferWorkerCallbackReturnType<typeof cb2>;


function indent(lines: string[], spaces: string = '  '): string[] {
  return lines.map(line => ('  ' + line));
}

function splitLines(text: string): string[] {
  return text.split(/\r?\n/);
}

const nativeFunctionRegExp: RegExp = /^function\s+.*\(.*\)\s*\{\s*\[native code\]\s*\}$/g;

export function PrepareFunctionForWorker(callback: WorkerCallback, externalCode: string[] = []): string[] {
  const functionString: string = callback.toString();

  if (nativeFunctionRegExp.test(functionString)) {
    throw new TypeError(`Cannot provide a native function to the worker.`);
  }

  return [
    ...externalCode,
    ``,
    `self.onmessage = function(event) {`,
    ...indent([
      `new Promise(function(resolve) {`,
      ...indent([
        `resolve((`,
        ...indent([
          ...splitLines(functionString),
        ]),
        `).apply(null, event.data));`,
      ]),
      `})`,
      ...indent([
        `.then(function (result) {`,
        ...indent([
          `if ((typeof result !== 'object') || (result === null) || !result.hasOwnProperty('result')) {`,
          ...indent([
            `result = {`,
            ...indent([
              `result: result,`,
              `transferable: []`,
            ]),
            `};`,
          ]),
          `}`,
          ``,
          `if (result.transferable === void 0) {`,
          ...indent([
            `result.transferable = [];`,
          ]),
          `} else if (!Array.isArray(result.transferable)) {`,
          ...indent([
            `throw new TypeError('Expected array as result.transferable.');`,
          ]),
          `}`,
          ``,
          `return {`,
          ...indent([
            `result: { success : true, result: result.result },`,
            `transferable: result.transferable`,
          ]),
          `};`,
        ]),
        `})`, // separate catch in case the then fails
        `.catch(function(error) {`,
        ...indent([
          `if (error instanceof Error) {`,
          ...indent([
            `var type = error.constructor.name || (/^\\\\s*function\\\\s+([^\\\\(\\\\s]*)\\\\s*/).exec(error.constructor.toString())[1];`,
            `error = { type: type, name: error.name || '', message: error.message || '', stack: error.stack || '' };`,
          ]),
          `}`,
          `return {`,
          ...indent([
            `result: { success : false, error: error },`,
            `transferable: []`,
          ]),
          `};`,
        ]),
        `})`,
        `.then(function(result) { self.postMessage(result.result, result.transferable); });`,
      ]),
    ]),
    `}`,
  ];
}


export function CreateBlobScriptForWorker(callback: WorkerCallback, externalCode?: string[]): Blob {
  // console.log(PrepareFunctionForWorker(callback, externalCode).join('\n'));
  return new Blob([PrepareFunctionForWorker(callback, externalCode).join('\n')], { type: 'application/javascript' });
}


export function CreateWorker(callback: WorkerCallback, externalCode?: string[]): Worker {
  const url = URL.createObjectURL(CreateBlobScriptForWorker(callback, externalCode));
  const worker: Worker = new Worker(url);
  URL.revokeObjectURL(url);
  return worker;
}


export class Program<CB extends WorkerCallback> {


  private _worker: Worker;
  private _runPromise: Promise<InferWorkerCallbackReturnType<CB>>;

  constructor(callback: CB, externalCode?: string[]) {
    this._worker = CreateWorker(callback, externalCode);
    this._runPromise = Promise.resolve(void 0) as any;
  }

  run(args: InferWorkerCallbackArguments<CB>, transferable: Transferable[] = []): Promise<InferWorkerCallbackReturnType<CB>> {
    this._runPromise = this._runPromise
      .then(() => {
        return new Promise<InferWorkerCallbackReturnType<CB>>((resolve: any, reject: any) => {
          const onmessage = (event: MessageEvent) => {
            this._worker.removeEventListener('message', onmessage);
            if (event.data.success) {
              resolve(event.data.result);
            } else {
              let error: any = event.data.error;

              if (typeof error === 'object') {
                const type: any = (error.type in globalThis) ? (globalThis as any)[error.type] : Error;
                const reconstructedError: any = new type(error.message || '');
                if (error.name && (error.name !== reconstructedError.name)) {
                  reconstructedError.name = error.name
                }
                reconstructedError.stack = error.stack || `${ error.name }: ${ error.message }\n\tempty stack`;
                error = reconstructedError;
              }

              reject(error);
            }
          };
          this._worker.addEventListener('message', onmessage);
          this._worker.postMessage(args, transferable);
        });
      });

    return this._runPromise;
  }

  terminate(): void {
    this._worker.terminate();
  }
}


export async function testProgram1() {
  const program = new Program((timeout: number) => {
    const date = Date.now() + timeout;
    let count: number = 0;
    while (Date.now() < date) {
      count++;
    }
    return count;
  });

  console.log('program 1 result', await program.run([1000]));
}

export async function testProgram2() {
  const program = new Program(() => {
    throw new TypeError(`Expected string as input`);
  });

  try {
    await program.run([]);
  } catch (error) {
    console.error(error);
  }
}


export async function testProgram3() {
  const program = new Program((a: Uint8Array, b: Uint8Array) => {
    const result = new Uint8Array(Math.max(a.length, b.length));
    for (let i = 0, l = result.length; i < l ; i++) {
      result[i] = ((i < a.length) ? a[i] : 0) + ((i < b.length) ? b[i] : 0);
    }
    return {
      result: result,
      transferable: [result.buffer]
    };
  });

  const a = new Uint8Array([1, 2, 3, 4]);
  const b = new Uint8Array([5, 6, 7, 8]);

  console.log('program 3 result', await program.run([a, b], [a.buffer, b.buffer]));
}

export async function testProgram4() {
  const program = new Program((timeout: number) => {
    return new Promise<void>((resolve: any) => {
      setTimeout(resolve, timeout);
    });
  });

  console.log('program 4 result', await program.run([1000]));
}


export async function testProgram5() {
  console.log('program 5');

  const program = new Program((array: any[], value: number) => {
    return array.indexOf(value);
  });

  const array = Array.from({ length: 1e6 }, () => Math.random());
  const value: number = array[Math.floor(array.length / 2)];
  let result: number;

  console.time('normal');
  result = array.indexOf(value);
  console.timeEnd('normal');
  console.log(result);

  let promise: any;
  console.time('worker-in');
  console.time('worker-out');
  promise = program.run([array, value]);
  console.timeEnd('worker-out');
  result = await promise;
  console.timeEnd('worker-in');

  console.log(result);


}

export async function testProgram6() {
  console.log('program 6');

  const cb = (count: number) => {
    const canvas = new OffscreenCanvas(1000, 1000);
    const ctx: OffscreenCanvasRenderingContext2D = canvas.getContext('2d') as OffscreenCanvasRenderingContext2D;
    const size: number = 20;

    for (let i = 0; i < count; i++) {
      ctx.fillStyle = `rgb(${ Math.floor(Math.random() * 256) }, ${ Math.floor(Math.random() * 256) }, ${ Math.floor(Math.random() * 256) })`;
      ctx.fillRect(Math.floor(Math.random() * canvas.width), Math.floor(Math.random() * canvas.height), size, size);
    }

    const image = canvas.transferToImageBitmap();
    return {
      result: image,
      transferable: [image]
    };
  };

  // const program = new Program(cb);

  const render = (canvas: HTMLCanvasElement, image: ImageBitmap) => {
    const context = canvas.getContext('bitmaprenderer') as any;
    context.transferFromImageBitmap(image);
    // const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    // context.drawImage(image, 0, 0);
  };

  let image: ImageBitmap;
  const count: number = 1e6;

  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  canvas.style.width = `${ canvas.width }px`;
  canvas.style.height = `${ canvas.height }px`;
  canvas.style.border = `2px solid black`;
  document.body.appendChild(canvas);

  console.time('normal');
  image = cb(count).result;
  console.timeEnd('normal');

  render(canvas, image);

  const program = new Program(cb);
  let promise: any;
  console.time('worker-in');
  console.time('worker-out');
  promise = program.run([count]);
  console.timeEnd('worker-out');
  image = await promise;
  console.timeEnd('worker-in');

  render(canvas, image);
}

export async function testProgram() {
  // await testProgram1();
  // await testProgram2();
  // await testProgram3();
  // await testProgram4();
  // await testProgram5();
  await testProgram6();
}

