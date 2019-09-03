import { Task } from '../notifications/observables/task/implementation';
import { ITask, ITaskContext } from '../notifications/observables/task/interfaces';
import { ICancelToken } from '../misc/cancel-token/interfaces';
import { CancelReason, CancelToken } from '../misc/cancel-token/implementation';
import { IFromReadableStreamObservable } from '../notifications/observables/finite-state/from/readable-stream/interfaces';
import { FromReadableStreamObservable } from '../notifications/observables/finite-state/from/readable-stream/implementation';
import { IProgress } from '../misc/progress/interfaces';
import { ITaskAsyncIteratorValue, taskFromAsyncIterator } from '../notifications/observables/task/from/async-iterable';
import { Progress } from '../misc/progress/implementation';
import { taskFromPromise } from '../notifications/observables/task/from/promise';
import { taskFromTasksInParallel } from '../notifications/observables/task/from/tasks';


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
    .on('cancel', (error: any) => {
      console.log('cancel', error);
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
      task.cancel(new CancelReason('Manual cancel'));
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
    .on('cancel', (reason?: any) => {
      clear();
      document.body.appendChild(new Text('[CANCELLED]: ' + (reason ? reason.message: '')));
    });
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
  // await testTaskFetch();
  // await testTaskAsyncIterable();
  // await testTaskFromPromise();
  await testMultiTasks();
}
