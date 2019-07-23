import { CancellablePromise } from '../promises/cancellable-promise/implementation';
import { IPromiseCancelToken } from '../notifications/observables/finite-state/promise/promise-cancel-token/interfaces';
import { DeferredPromise } from '../promises/deferred-promise/implementation';
import { $delay } from '../promises/cancellable-promise/helpers';

export function testCancellablePromise() {
  const a = CancellablePromise.resolve(1)
    .then((value: number, token: IPromiseCancelToken) => {
      console.log('1', value);
      token.cancel('cancelled');
      return value * 2;
    })
    .then((value: number) => {
      console.log('never append', value);
    })
    .cancelled((token: IPromiseCancelToken) => {
      console.log('cancelled', token.reason);
      return new Promise(() => {});
    })
    .then(() => {
      console.log('never append');
    });

  a.promise
    .then(() =>{
      console.log('never append');
    });

  const b = CancellablePromise.all([Promise.resolve({ a: 1 }), { b: 1 }, 'a'])
    .then((values: any[], token: IPromiseCancelToken) => {
      console.log('values', values);
      token.cancel('cancel b');
    })
    .then(() =>{
      console.log('never append');
    });



  CancellablePromise.raceCancellable(Array.from({ length: 4 }, (value: void, index: number) => {
    return (token: IPromiseCancelToken) => {
      return $delay(index * 1000, token)
        .cancelled((token: IPromiseCancelToken) => {
          console.log(`index: ${ index } cancelled: ${ token.reason.message }`);
        });
    };
  }))
    .then(() => {
      console.log('done');
    });

  // console.log(a);
  // debugger;
}

export function testDeferredPromise() {
  const a = new DeferredPromise();
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
  // testDeferredPromise();
}
