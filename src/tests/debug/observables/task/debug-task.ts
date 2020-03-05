import { ITask } from '../../../../notifications/observables/task/interfaces';
import { IProgress } from '../../../../misc/progress/interfaces';
import { Progress } from '../../../../misc/progress/implementation';
import { taskFromFiniteStateObservable } from '../../../../notifications/observables/task/built-in/from/finite-state-observable';
import { XHRObservable } from '../../../../notifications/observables/finite-state/built-in/promise/xhr-observable/implementation';
import { promisePipe } from '../../../../operators/pipes/promisePipe';
import { Task } from '../../../../notifications/observables/task/implementation';
import { ITaskContext } from '../../../../notifications/observables/task/context/interfaces';
import { INotificationsObserver } from '../../../../notifications/core/notifications-observer/interfaces';
import { ITaskKeyValueMap, TTaskState } from '../../../../notifications/observables/task/types';

// function $fetch(input: RequestInfo, init?: RequestInit): ITask<Blob> {
//   return taskFromPromiseFactory((signal: IAdvancedAbortSignal, progress: (progress: IProgress) => void) => {
//     return CancellablePromise.fetch(input, init, { signal })
//       .then((response: Response) => {
//         return new Promise<Blob>((resolve, reject) => {
//           if (response.ok) {
//             let loaded: number = 0; // total number of bytes read
//             const chunks: Uint8Array[] = []; // list of data chunks received
//
//             // get the type of data
//             const type: string = response.headers.has('content-type')
//               ? response.headers.get('content-type') as string
//               : 'application/octet-stream';
//
//             // get the total number of bytes to fetch
//             const total: number = response.headers.has('content-Length')
//               ? parseInt(response.headers.get('content-Length') as string, 10)
//               : Number.POSITIVE_INFINITY;
//
//             const clear = () => {
//               chunksObservable.clearObservers();
//               signalObserver.deactivate();
//             };
//
//             const signalObserver = signal.addListener('abort', () => {
//               clear();
//             });
//
//             // observe the data stream of downloaded bytes
//             const chunksObservable = new FromReadableStreamObservable((response.body as ReadableStream<Uint8Array>).getReader())
//               .on('next', (chunk: Uint8Array) => {
//                 loaded += chunk.length;
//                 chunks.push(chunk);
//                 progress(new Progress({ loaded, total, name: 'download' }));
//               })
//               .on('error', (error: any) => {
//                 clear();
//                 reject(error);
//               })
//               .on('complete', () => {
//                 clear();
//                 resolve(new Blob(chunks, { type: type }));
//               });
//
//             signalObserver.activate();
//           } else {
//             reject(new Error(`Failed to fetch resource: ${ response.status } - ${ response.statusText }`));
//           }
//         });
//       });
//   });
// }

// function fetchTask(input: RequestInfo, init?: RequestInit): ITask<Response> {
//   const options: IFiniteStateObservableGenericOptions = { mode: 'cache-per-observer' };
//   return taskFromFiniteStateObservable(
//     new XHRObservable(input, init, options)
//       .pipeThrough(promisePipe<Response, Blob, never>((response: Response) => {
//         if (response.ok) {
//           return response.blob();
//         } else {
//           throw response;
//         }
//       }, undefined, options))
//   );
// }

function fetchTask(input: RequestInfo, init?: RequestInit): ITask<Response> {
  return taskFromFiniteStateObservable(new XHRObservable(input, init, { mode: 'cache-per-observer' }));
}

function responseToBlobTask(task: ITask<Response>): ITask<Blob> {
  return taskFromFiniteStateObservable(
    task
      .pipeThrough(promisePipe<Response, Blob, never>((response: Response) => {
        if (response.ok) {
          return response.blob();
        } else {
          throw response;
        }
      }, undefined, { mode: 'cache-per-observer' }))
  );
}

/*-------------------------------*/

// export type TWrappedTaskMethodNames = 'start' | 'pause' | 'resume' | 'abort';
// export type TWrappedTaskMethodNames = Extract<keyof ITaskKeyValueMap<any>, 'start' | 'pause' | 'resume' | 'abort'>;
export type TWrappedTaskMethodNames = Extract<keyof ITask<any>, 'start' | 'pause' | 'resume' | 'abort'>;

/**
 * Returns a callback which throws when called, notifying the user that it's forbidden to use
 */
export function CreateWrappedTaskForbiddenMethodCall(methodName: TWrappedTaskMethodNames): () => never {
  return () => {
    throw new Error(`Cannot call '${ methodName }' on a wrapped Task`);
  };
}

/**
 * Returns a callback used to undo the override
 */
export function WrapTaskMethodCall(
  wrappingTask: ITask<any>,
  wrappedTask: ITask<any>,
  methodName: TWrappedTaskMethodNames,
  callback: (nativeMethod: any) => void,
  state?: TTaskState
): () => void {

  // TODO continue here
  // - infer proper state
  // - finish WrapTask
  if (state === void 0) {
    switch (methodName) {
      case 'start':
        state = 'run';
        break;
    }
  }

  let observer: INotificationsObserver<any, any> | undefined;

  const nativeMethod = wrappedTask[methodName].bind(wrappedTask);
  wrappedTask[methodName] = CreateWrappedTaskForbiddenMethodCall(methodName);

  if (wrappingTask.state === state) {
    callback(nativeMethod);
  } else {
    observer = wrappingTask.addListener(methodName, () => {
      callback(nativeMethod);
    }).activate();
  }

  return () => {
    if (observer !== void 0) {
      observer.deactivate();
    }
    delete wrappedTask[methodName];
  };
}

/**
 * Links a task with another:
 *  - transfers the 'start', 'abort', 'resume' and 'pause' from the wrapping to the wrapped task
 *    -> until the wrapped task is done ('errored', 'complete', or aborted by wrapping class)
 */
// TODO finish
export function WrapTask(
  wrappingTask: ITask<any>,
  wrappedTask: ITask<any>
): void {


  if (wrappedTask.state === 'await') {

    const abort = wrappedTask.abort.bind(wrappedTask);
    wrappedTask.abort = CreateWrappedTaskForbiddenMethodCall('abort');

    const pause = wrappedTask.pause.bind(wrappedTask);
    const run = wrappedTask.start.bind(wrappedTask);

    const onWrappingTaskAbort = (reason: any) => {
      abort(reason);
    };

    const onWrappingTaskPause = () => {
      wrappedTask.pause();
    };

    const onWrappingTaskRun = () => {
      wrappedTask.start();
    };

    if (wrappingTask.state === 'abort') {
      onWrappingTaskAbort(wrappingTask.result);
    } else if (wrappingTask.state === 'pause') {
      onWrappingTaskPause();
    } else if (wrappingTask.state === 'run') {
      onWrappingTaskRun();
    } else {
      const clear = () => {
        wrappingTaskStartListener.deactivate();
        wrappingTaskAbortListener.deactivate();
        wrappingTaskPauseListener.deactivate();
        wrappingTaskResumeListener.deactivate();
        wrappedTaskCompleteListener.deactivate();
        wrappedTaskErrorListener.deactivate();
        wrappedTaskAbortListener.deactivate();
      };

      const wrappingTaskStartListener = wrappingTask.addListener('start', onWrappingTaskRun);
      const wrappingTaskAbortListener = wrappingTask.addListener('abort', onWrappingTaskAbort);
      const wrappingTaskPauseListener = wrappingTask.addListener('pause', onWrappingTaskPause);
      const wrappingTaskResumeListener = wrappingTask.addListener('resume', onWrappingTaskRun);

      const wrappedTaskCompleteListener = wrappedTask.addListener('complete', clear);
      const wrappedTaskErrorListener = wrappedTask.addListener('error', clear);
      const wrappedTaskAbortListener = wrappedTask.addListener('abort', () => {
        clear();
        // onWrappedTaskAbort();
      });

      wrappingTaskStartListener.activate();
      wrappingTaskAbortListener.activate();
      wrappingTaskPauseListener.activate();
      wrappingTaskResumeListener.activate();
      wrappedTaskCompleteListener.activate();
      wrappedTaskErrorListener.activate();
      wrappedTaskAbortListener.activate();
    }
  } else {
    throw new Error(`Wrapped task must be in 'await' state`);
  }
}

// export function taskFromTasksInSequence<T>(tasks: ITask<any>[]): ITask<void> {
//   return new Task<void>((context: ITaskContext<void>) => {
//     let promise: Promise<void> = Promise.resolve();
//     for (let i = 0, l = tasks.length; i < l; i++) {
//       const task: ITask<any> = tasks[i];
//       promise = promise
//         .then(() => {
//           context.progressUntilRun(new Progress({ loaded: i + 1, total: l, name: 'count' }));
//           PassthroughsTask(context, task);
//           return task.toPromise('never');
//         });
//     }
//
//     promise
//       .then(() => {
//         context.completeUntilRun();
//       }, (error: any) => {
//         context.errorUntilRun(error);
//       });
//   });
// }

/*-----*/


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

async function debugFetchTask() {
  const url: string = `https://file-examples.com/wp-content/uploads/2017/02/zip_2MB.zip`;
  // const url: string = `https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip`;
  const task = logTask(fetchTask(noCORS(url)));
  task.start();
  // fetchTask.cancel('manual cancel');
  console.log('promise', await task.toPromise());
}

/*--------------------------*/

/*--------------------------*/

export async function debugTask() {
  // await debugFetchTask();
  // await speedTest();
}
