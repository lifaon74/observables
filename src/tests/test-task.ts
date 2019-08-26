import { Task } from '../notifications/task/implementation';
import { ITask, ITaskContext } from '../notifications/task/interfaces';
import { ICancelToken } from '../misc/cancel-token/interfaces';
import { CancelToken } from '../misc/cancel-token/implementation';
import {
  FromReadableStreamObservable, IFromReadableStreamObservable
} from '../notifications/observables/finite-state/from/readable-stream/public';
import { IProgress } from '../misc/progress/interfaces';
import { periodTime } from '../classes/pure-pipes';
import { finiteStateObservableToPromise, toPromise } from '../operators/to/toPromise';

export async function testTask() {

  function noCORS(url: string): string {
    return `https://cors-anywhere.herokuapp.com/${ url }`;
  }

  function $fetch(input: RequestInfo, init?: RequestInit): ITask<Blob> {
    return new Task<Blob>((context: ITaskContext<Blob>) => {
      // creates a cancel token used for fetching and promises
      const token: ICancelToken = new CancelToken();
      let chunksObservable: IFromReadableStreamObservable<Uint8Array>;

      // clear resources
      const clear = () => {
        cancelListener.deactivate();
        startListener.deactivate();

        if (chunksObservable !== void 0) {
          chunksObservable.clearObservers();
        }
      };

      // when the task is cancelled, abort the http request
      const cancelListener = context.task.addListener('cancel', () => {
        clear();
        token.cancel();
      });

      // forbid pause, because fetching cannot be paused
      const pauseListener = context.task.addListener('pause', () => {
        clear();
        throw new Error(`Cannot pause a fetch`);
      });

      // on start
      const startListener = context.task.addListener('start', () => {
        fetch(...token.wrapFetchArguments(input, init)) // do the http request
          .then(token.wrapFunction((response: Response) => {
            if (response.ok) {
              let bytesRead: number = 0; // total number of bytes read
              const chunks: Uint8Array[] = []; // list of data chunks received

              // get the type of data
              const type: string = response.headers.has('content-type')
                ? response.headers.get('content-type') as string
                : 'application/octet-stream';

              // get the total number of bytes to fetch
              const total: number = response.headers.has('content-Length')
                ? parseInt(response.headers.get('content-Length') as string, 10)
                : Number.POSITIVE_INFINITY;

              // observe the data stream of downloaded bytes
              chunksObservable = new FromReadableStreamObservable((response.body as ReadableStream<Uint8Array>).getReader())
                .on('next', (chunk: Uint8Array) => {
                  bytesRead += chunk.length;
                  context.progress(bytesRead, total);
                  chunks.push(chunk);
                })
                .on('error', (error: any) => {
                  context.error(error);
                  clear();
                })
                .on('complete', () => {
                  context.next(new Blob(chunks, { type: type }));
                  context.complete();
                  clear();
                });
            } else {
              context.error(new Error(`Failed to fetch resource: ${ response.status } - ${ response.statusText }`));
              clear();
            }
          }), token.wrapFunction((error: any) => {
            context.error(error);
            clear();
          }));
      });

      cancelListener.activate();
      pauseListener.activate();
      startListener.activate();
    });
  }

  const fetchTask = $fetch(noCORS('https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip'))
    .on('start', () => {
      console.log('start');
    })
    .on('complete', () => {
      console.log('complete');
    })
    .on('error', (error: any) => {
      console.log('error', error);
    })
    .on('cancel', (error: any) => {
      console.log('cancel', error);
    })
    .on('next', (value: Blob) => {
      console.log('next', value);
    })
    .on('progress', (progress: IProgress) => {
      console.log('progress', `${ Math.floor((progress.loaded / progress.total) * 100) }%`);
    })
  ;
  fetchTask.start();
  // fetchTask.cancel('manual cancel');
  console.log('promise', await fetchTask.toPromise());
}
