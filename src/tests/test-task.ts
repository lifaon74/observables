import { Task } from '../notifications/observables/task/implementation';
import { ITask} from '../notifications/observables/task/interfaces';
import { IFromReadableStreamObservable } from '../notifications/observables/finite-state/built-in/from/readable-stream/interfaces';
import { FromReadableStreamObservable } from '../notifications/observables/finite-state/built-in/from/readable-stream/implementation';
import { IProgress } from '../misc/progress/interfaces';
import { ITaskAsyncIteratorValue, taskFromAsyncIterator } from '../notifications/observables/task/built-in/from/async-iterable';
import { Progress } from '../misc/progress/implementation';
import { taskFromPromise, taskFromPromiseFactory } from '../notifications/observables/task/built-in/from/promise';
import { taskFromTasksInParallel } from '../notifications/observables/task/built-in/from/tasks';
import { AbortReason } from '../misc/reason/built-in/abort-reason';
import { AdvancedAbortController } from '../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortController } from '../misc/advanced-abort-controller/interfaces';
import { ITaskContext } from '../notifications/observables/task/context/interfaces';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { CancellablePromise } from '../promises/cancellable-promise/implementation';
import { IFiniteStateObservable } from '../notifications/observables/finite-state/interfaces';
import {
  TFiniteStateObservableGeneric, TFiniteStateObserverGeneric
} from '../notifications/observables/finite-state/types';
import { IActivable } from '../misc/activable/interfaces';

//
// // export interface IReversible {
// //   apply(): Promise<void>;
// //   reverse(): Promise<void>;
// // }
// //
// // export interface IReversibleContext {
// //   register(key: any[] | string, callback: () => IReversible): void;
// // }
//
// // INFO: just some ideas
//
// export type TRegisterMode = // if key is already present:
//   'skip' // doesn't call the promise factory
//   | 'warn' // doesn't call the promise factory and displays a warn message for the developer
//   | 'throw' // doesn't call the promise factory and throws an error for the developer
//   | 'replace' // cancels the previous promise, then calls the promise factory
//   | 'queue' // waits for previous promise to resolve or reject, then calls the promise factory
//   ;
//
// export interface ITasksContext {
//   register(key: any[] | string, task: ITask<any>, mode?: TRegisterMode): ITask<void>;
//
//   // get(key: string | any[]): ICancellablePromise<any> | undefined;
//   //
//   // clear(key: string | any[]): ICancellablePromise<any> | undefined;
//   //
//   // clearAll(): Promise<void>;
//
// }
//
// // OR
//
// export interface IFiniteStateObservablesContext {
//   register(key: any[] | string, observable: TFiniteStateObservableGeneric<any>, observer: TFiniteStateObserverGeneric<any>, mode?: TRegisterMode): void;
//   // or
//   register2(key: any[] | string, callback: () => TFiniteStateObserverGeneric<any>, mode?: TRegisterMode): void;
// }
//
// // OR
//
// /**
//  * PROBLEM: 'queue' cannot work because Activable has not a final state
//  */
// export interface IActivableContext {
//   register(key: any[] | string, activable: IActivable, mode?: TRegisterMode): void;
// }
//
//
// // OR
//
// /**
//  * INFO: supports all kind => very generic
//  * PROBLEM: doesnt really make sense for Activable like class list, event listener, timers, etc...
//  * Merging IReversible with ITask is a complex task:
//  *  - reversible has no end, and may be reversed
//  *  - task has a final stated, and may be aborted
//  */
// export interface ICancellableContext2 {
//   registerTask(key: any[] | string, callback: (signal: IAdvancedAbortSignal) => TPromiseOrValue<any>, mode?: TRegisterMode): void;
//   registerActivable(key: any[] | string, callback: () => IActivable, mode?: Omit<TRegisterMode, 'queue'>): void;
// }

/*---------------------------------------------------*/



function noCORS(url: string): string {
  return `https://cors-anywhere.herokuapp.com/${ url }`;
}

function logTask<T extends ITask<any>>(task: T): T {
  return task
    .on('start', () => {
      console.log('start');
    })
    .on('complete', () => {
      console.log('complete');
    })
    .on('error', (error: any) => {
      console.log('error', error);
    })
    .on('abort', (error: any) => {
      console.log('abort', error);
    })
    .on('next', (value: Blob) => {
      console.log('next', value);
    })
    .on('progress', (progress: IProgress) => {
      console.log('progress', progress.toString());
    })
  ;
}

function generateTaskControlButton<T extends ITask<any>>(task: T): T {
  const pauseResumeButton = document.createElement('button');
  pauseResumeButton.innerText = 'start';
  pauseResumeButton.style.margin = `10px`;
  document.body.appendChild(pauseResumeButton);

  pauseResumeButton.addEventListener('click', () => {
    if (task.state === 'run') {
      pauseResumeButton.innerText = 'resume';
      task.pause();
    } else {
      pauseResumeButton.innerText = 'pause';
      task.start();
    }
  });


  const cancelButton = document.createElement('button');
  cancelButton.innerText = 'cancel';
  cancelButton.style.margin = `10px`;
  document.body.appendChild(cancelButton);

  cancelButton.addEventListener('click', () => {
    if (
      (task.state === 'await')
      || (task.state === 'run')
      || (task.state === 'pause')
    ) {
      task.abort(new AbortReason('Manual cancel'));
    }
  });

  const clear = () => {
    document.body.removeChild(pauseResumeButton);
    document.body.removeChild(cancelButton);
  };

  return task
    .on('error', (error?: any) => {
      clear();
      document.body.appendChild(new Text('[ERROR]: ' + (error ? error.message : '')));
    })
    .on('complete', (error: any) => {
      clear();
      document.body.appendChild(new Text('[DONE]'));
    })
    .on('abort', (reason?: any) => {
      clear();
      document.body.appendChild(new Text('[ABORTED]: ' + (reason ? reason.message: '')));
    });
}

function $fetch_old(input: RequestInfo, init?: RequestInit): ITask<Blob> {
  return new Task<Blob>((context: ITaskContext<Blob>) => {
    // creates an abort controller used for fetching and promises
    const controller: IAdvancedAbortController = new AdvancedAbortController();
    let chunksObservable: IFromReadableStreamObservable<Uint8Array>;

    // clear resources
    const clear = () => {
      cancelListener.deactivate();
      pauseListener.deactivate();
      startListener.deactivate();

      if (chunksObservable !== void 0) {
        chunksObservable.clearObservers();
      }
    };

    // when the task is aborted, abort the http request
    const cancelListener = context.task.addListener('abort', () => {
      clear();
      controller.abort();
    });

    // forbid pause, because fetching cannot be paused
    const pauseListener = context.task.addListener('pause', () => {
      clear();
      throw new Error(`Cannot pause a fetch`);
    });

    // on start
    const startListener = context.task.addListener('start', () => {
      fetch(...controller.signal.wrapFetchArguments(input, init)) // do the http request
        .then(controller.signal.wrapFunction((response: Response) => {
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
                context.progress(new Progress(bytesRead, total));
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
        }), controller.signal.wrapFunction((error: any) => {
          context.error(error);
          clear();
        }));
    });

    cancelListener.activate();
    pauseListener.activate();
    startListener.activate();
  });
}

function $fetch(input: RequestInfo, init?: RequestInit): ITask<Blob> {
  return taskFromPromiseFactory((signal: IAdvancedAbortSignal, progress: (progress: IProgress) => void) => {
    return CancellablePromise.fetch(input, init, { signal })
      .then((response: Response) => {
        return new Promise<Blob>((resolve, reject) => {
          if (response.ok) {
            let loaded: number = 0; // total number of bytes read
            const chunks: Uint8Array[] = []; // list of data chunks received

            // get the type of data
            const type: string = response.headers.has('content-type')
              ? response.headers.get('content-type') as string
              : 'application/octet-stream';

            // get the total number of bytes to fetch
            const total: number = response.headers.has('content-Length')
              ? parseInt(response.headers.get('content-Length') as string, 10)
              : Number.POSITIVE_INFINITY;

            const clear = () => {
              chunksObservable.clearObservers();
            };

            // observe the data stream of downloaded bytes
            const chunksObservable = new FromReadableStreamObservable((response.body as ReadableStream<Uint8Array>).getReader())
              .on('next', (chunk: Uint8Array) => {
                loaded += chunk.length;
                chunks.push(chunk);
                progress(new Progress({ loaded, total, name: 'download' }));
              })
              .on('error', (error: any) => {
                clear();
                reject(error);
              })
              .on('complete', () => {
                clear();
                resolve(new Blob(chunks, { type: type }));
              });
          } else {
            reject(new Error(`Failed to fetch resource: ${ response.status } - ${ response.statusText }`));
          }
        });
      });
  });
}

const urls: string[] = [
  'https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_100kB.jpg',
  'https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_500kB.jpg',
  'https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_1MB.jpg',
  'https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_2500kB.jpg',
];





export async function testTaskFetch() {


  const task = logTask($fetch(noCORS('https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip')));
  task.start();
  // fetchTask.cancel('manual cancel');
  console.log('promise', await task.toPromise());
}


export async function testTaskAsyncIterable() {

  async function * run(urls: string[]): AsyncIterableIterator<ITaskAsyncIteratorValue<Blob>> {
    for (let i = 0, l = urls.length; i < l; i++) {
      const response: Response = await fetch(urls[i]);
      if (response.ok) {
        yield { value: await response.blob(), progress: new Progress(i + 1, l) };
      } else {
        throw new Error(`Failed to fetch resource: ${ response.status } - ${ response.statusText }`)
      }
    }
  }

  const task = logTask(taskFromAsyncIterator(run(urls.map(_ => noCORS(_)))));

  generateTaskControlButton(task);

  console.log('promise', await task.toPromise());
}

export async function testTaskFromPromise() {
  const task = logTask(taskFromPromise(fetch(noCORS(urls[0])).then(_ => _.blob()))).start();

  console.log('promise', await task.toPromise());
}

export async function testMultiTasks() {

  const tasks: ITask<any>[] = urls.map(url => $fetch(noCORS(url)));

  // const task = logTask(taskFromTasksInSequence(tasks)).start();
  // const task = logTask(taskFromTasksInParallel(tasks, 'aggregate')).start();

  const task = logTask(
    taskFromTasksInParallel([
      taskFromTasksInParallel(urls.map(url => $fetch(noCORS(url))), 'aggregate'),
      taskFromTasksInParallel(urls.map(url => $fetch(noCORS(url))), 'aggregate'),
      taskFromTasksInParallel(urls.map(url => $fetch(noCORS(url))), 'aggregate'),
      taskFromTasksInParallel(urls.map(url => $fetch(noCORS(url))), 'aggregate'),
    ], 'aggregate')
  ).start();

  console.log('promise', await task.toPromise());
}

// export async function testSequentialTasks2() {
//   function sequentialTasks(tasks: ITask<any>[]): ITask<void> {
//     return taskFromAsyncIterator<void>((async function * (): AsyncIterableIterator<ITaskAsyncIteratorValue<void>> {
//       for (let i = 0, l = tasks.length; i < l; i++) {
//         await tasks[i].start().toPromise();
//         yield { progress: new Progress(i + 1, l) };
//       }
//     })());
//   }
//
//   const tasks: ITask<any>[] = [
//     noCORS('https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_100kB.jpg'),
//     noCORS('https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_500kB.jpg'),
//     noCORS('https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_1MB.jpg'),
//     noCORS('https://file-examples.com/wp-content/uploads/2017/10/file_example_JPG_2500kB.jpg'),
//   ].map(url => $fetch(url));
//
//   const task = logTask(sequentialTasks(tasks)).start();
//
//   console.log('promise', await task.toPromise());
// }

export async function testTask() {
  await testTaskFetch();
  // await testTaskAsyncIterable();
  // await testTaskFromPromise();
  // await testMultiTasks();
}
