import { ITask, ITaskContext } from '../interfaces';
import { Task } from '../implementation';
import { TPromiseFactory } from '../../../../promises/interfaces';
import { IsCancellablePromise } from '../../../../promises/cancellable-promise/constructor';

// export function taskFromGenericPromise<T>(promise: Promise<T>): ITask<T> {
//   return taskFromGenericPromiseFactory<T>(() => promise);
// }
//
//
// export function taskFromNativePromiseFactory<T>(promiseFactory: TPromiseFactory<T>): ITask<T> {
//   return new Task<T>((context: ITaskContext<T>) => {
//     const startListener = context.task.addListener('start', () => {
//       startListener.deactivate();
//
//       promiseFactory()
//         .then((value: T) => {
//           context.nextUntilRun(value);
//           context.completeUntilRun();
//         }, (error: any) => {
//           context.errorUntilRun(error);
//         });
//     });
//
//     startListener.activate();
//   });
// }
//
// export function taskFromCancellablePromise<T>(promise: ICancellablePromise<T>): ITask<T> {
//   return taskFromCancellablePromiseFactory(() => promise);
// }
//
// export function taskFromCancellablePromiseFactory<T>(promiseFactory: (...args: any[]) => ICancellablePromise<T>): ITask<T> {
//   return new Task<T>((context: ITaskContext<T>) => {
//
//     let promise: ICancellablePromise<T>;
//
//     const clear = () => {
//       startListener.deactivate();
//       cancelListener.deactivate();
//     };
//
//     const cancelListener = context.task.addListener('cancel', (reason: any) => {
//       clear();
//       if (promise !== void 0) {
//         promise.token.cancel(reason);
//       }
//     });
//
//     const startListener = context.task.addListener('start', () => {
//       startListener.deactivate();
//       promise = promiseFactory();
//       promise
//         .then((value: T) => {
//           context.nextUntilRun(value);
//           context.completeUntilRun();
//           clear();
//         }, (error: any) => {
//           context.errorUntilRun(error);
//           clear();
//         }, () => {
//           if (context.task.state !== 'cancel') {
//             context.errorUntilRun(new Error(`Promise has been cancelled`));
//           }
//           clear();
//         });
//     });
//
//     startListener.activate();
//     cancelListener.activate();
//   });
// }
//


export function taskFromPromise<T>(promise: Promise<T>): ITask<T> {
  return taskFromPromiseFactory<T>(() => promise);
}

/**
 * Creates a Task from a promise factory
 */
export function taskFromPromiseFactory<T>(promiseFactory: TPromiseFactory<T>): ITask<T> {
  return new Task<T>((context: ITaskContext<T>) => {

    let promise: Promise<T>;

    const clear = () => {
      startListener.deactivate();
      cancelListener.deactivate();
    };

    const cancelListener = context.task.addListener('cancel', (reason: any) => {
      clear();
      // if ((promise !== void 0) && IsCancellablePromise(promise)) {
      //   promise.token.cancel(reason);
      // }
    });

    const startListener = context.task.addListener('start', () => {
      startListener.deactivate();
      promise = promiseFactory();
      promise
        .then((value: T) => {
          context.nextUntilRun(value);
          context.completeUntilRun();
          clear();
        }, (error: any) => {
          context.errorUntilRun(error);
          clear();
        });

      if (IsCancellablePromise(promise)) {
        promise.cancelled(() => {
          if (!context.task.done) {
            context.errorUntilRun(new Error(`Promise has been cancelled`));
          }
          clear();
        });
      }
    });

    startListener.activate();
    cancelListener.activate();
  });
}


