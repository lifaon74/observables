import { CancellablePromise } from '../promises/cancellable-promise/implementation';
import { IPromiseCancelToken } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { DeferredPromise } from '../promises/deferred-promise/implementation';

export function testCancellablePromise() {
  const a = CancellablePromise.resolve(1)
    .then((value: number, token: IPromiseCancelToken) => {
      console.log('1', value);
      // token.cancel('cancelled');
      return value * 2;
    })
    .then((value: number) => {
      console.log('never append', value);
    })
    .cancelled((token: IPromiseCancelToken) => {
      console.log('cancelled', token.reason);
    });

  a.promise()
    .then(() =>{
      console.log('never append');
    });

  const b = CancellablePromise.all([Promise.resolve({ a: 1 }), { b: 1 }, 'a'])
    .then((values) => {
      console.log('values', values);
    });

  console.log(a);
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
  // testCancellablePromise();
  testDeferredPromise();
}
