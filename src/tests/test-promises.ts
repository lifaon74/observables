import { CancellablePromise } from '../promises/cancellable-promise/implementation';
import { DeferredPromise } from '../promises/deferred-promise/implementation';
import { $delay } from '../promises/cancellable-promise/snipets';
import { OnFinallyResult } from '../promises/cancellable-promise/types';
import { AdvancedAbortController } from '../misc/advanced-abort-controller/implementation';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IAdvancedAbortController } from '../misc/advanced-abort-controller/interfaces';


export function testCancellablePromise() {
  const controller = new AdvancedAbortController();

  const a = CancellablePromise.resolve(1, controller.signal);

  const b =  a
    .then((value: number) => {
      console.log('then #1', value);
      controller.abort('manual cancel');
      return value * 2;
    })
    .then((value: number) => {
      console.log('never append', value);
    });

  const c = b
    .finally((state: OnFinallyResult<void>) => {
      console.log('finally', state);
      return $delay(1000);
    }, true)
    .cancelled((reason: any, newController: IAdvancedAbortController) => {
      console.log('cancelled', reason);
      // newController.abort('another cancel');
      return $delay(1000, newController.signal)
        .then(() => {
          return 4;
        });
    })
    .then((value: number | void) => {
      console.log('after cancelled caught', value);
    });

  b.promise
    .then(() =>{
      console.log('never append');
    });

  // const b = CancellablePromise.all([Promise.resolve({ a: 1 }), { b: 1 }, 'a'])
  //   .then((values: any[], token: IAdvancedAbortSignal) => {
  //     console.log('values', values);
  //     token.cancel('cancel b');
  //   })
  //   .then(() =>{
  //     console.log('never append');
  //   });
  //
  //
  //
  // CancellablePromise.raceCancellable(Array.from({ length: 4 }, (value: void, index: number) => {
  //   return (token: IAdvancedAbortSignal) => {
  //     return $delay(index * 1000, token)
  //       .cancelled((token: IAdvancedAbortSignal) => {
  //         console.log(`index: ${ index } cancelled: ${ token.reason.message }`);
  //       });
  //   };
  // }))
  //   .then(() => {
  //     console.log('done');
  //   });

  // console.log(a);
  // debugger;
}

// export function testConcurrentCancellablePromise() {
//   console.time('concurrent');
//   const promise = CancellablePromise.concurrentFactories(Array.from({ length: 100 }, (value: undefined, index: number) => {
//     return (token: IAdvancedAbortSignal) => {
//       return $delay(1000 * Math.random(), token)
//         .then(() => {
//           console.log(`promise #${index} done`);
//         });
//     };
//   }), 5)
//     .then(() => {
//       console.timeEnd('concurrent');
//     });
//
//   setTimeout(() => {
//     promise.token.cancel();
//   }, 2000);
// }

export function testDeferredPromise() {
  const a = new DeferredPromise<number>();
  a
    .then((value: number) => {
      console.log('1', value);
      return value * 2;
    })
    .then((value: number) => {
      console.log('2', value);
    });

  a.resolve(1);
}

export function testPromises() {
  testCancellablePromise();
  // testConcurrentCancellablePromise();
  // testDeferredPromise();
}
