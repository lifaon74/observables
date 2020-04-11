import { ITask } from '../../../../notifications/observables/task/interfaces';
import { IProgress } from '../../../../misc/progress/interfaces';
import { taskFromFiniteStateObservable } from '../../../../notifications/observables/task/built-in/from/finite-state-observable';
import { XHRObservable } from '../../../../notifications/observables/finite-state/built-in/promise/xhr-observable/implementation';
import { promisePipe } from '../../../../operators/pipes/promisePipe';
import {
  taskFromTasksInParallel, taskFromTasksInSequence
} from '../../../../notifications/observables/task/built-in/from/tasks';

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
  // const url: string = `https://file-examples.com/wp-content/uploads/2017/02/zip_2MB.zip`;
  // const url: string = `https://file-examples.com/wp-content/uploads/2017/02/zip_10MB.zip`;
  const url: string = `http://info.cern.ch/hypertext/WWW/TheProject.html`;
  const task = logTask(fetchTask(noCORS(url)));
  task.start();
  // setTimeout(() => task.abort('aborted'), 100);
  // task.abort('manual cancel');
  console.log('promise', await task.toCancellablePromise().toPromise());
}

/*--------------------------*/

async function debugWrapTask() {
  await debugTaskInSequence();
  // await debugTaskInParallel();
}

async function debugTaskInSequence() {
  const task1 = fetchTask(noCORS(`http://info.cern.ch/hypertext/WWW/TheProject.html`));
  const task2 = fetchTask(noCORS(`http://info.cern.ch/hypertext/WWW/Summary.html`));

  const seqTask = taskFromTasksInSequence([
    task1,
    task2,
  ]);
  logTask(seqTask);
  // seqTask.on('progress', () => {
  //   setTimeout(() =>  seqTask.abort('aborted'), 0);
  // });
  seqTask.start();
  console.log('promise', await seqTask.toPromise());
}

async function debugTaskInParallel() {
  const task1 = fetchTask(noCORS(`http://info.cern.ch/hypertext/WWW/TheProject.html`));
  const task2 = fetchTask(noCORS(`http://info.cern.ch/hypertext/WWW/Summary.html`));

  const seqTask = taskFromTasksInParallel([
    task1,
    task2,
  ]);
  logTask(seqTask);
  // seqTask.on('progress', () => {
  //   setTimeout(() =>  seqTask.abort('aborted'), 0);
  // });
  seqTask.start();
  console.log('promise', await seqTask.toPromise());
}

/*--------------------------*/

export async function debugTask() {
  // await debugFetchTask();
  await debugWrapTask();
}
