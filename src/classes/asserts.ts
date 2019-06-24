import { IPipe } from '../core/observable-observer/interfaces';
import { IObserver } from '../core/observer/interfaces';
import { IPromiseObservable } from '../notifications/observables/promise-observable/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { Observer } from '../core/observer/implementation';
import { PromiseObservable } from '../notifications/observables/promise-observable/implementation';
import { IObservable } from '../core/observable/interfaces';
import { toPromise } from '../operators/to/toPromise';
import { IFunctionObservable } from '../observables/distinct/function-observable/interfaces';
import { ISource } from '../observables/distinct/source/interfaces';

export function eq(a: any, b: any): boolean {
  return Object.is(a, b)
    || (JSON.stringify(a) === JSON.stringify(b));
}

export function fails(cb: () => any | Promise<any>): Promise<boolean> {
  return new Promise<boolean>(resolve => resolve(cb()))
    .then(() => false, () => true);
}


export function assert(cb: () => boolean | Promise<boolean>, message: string = cb.toString()): Promise<void> {
  return new Promise<boolean>(resolve => resolve(cb()))
    .then((result: boolean) => {
      if (!result) {
        new Error(`Assert failed: ${ message }`);
      }
    });
}

export function assertFails(cb: () => any | Promise<any>, message: string = cb.toString()): Promise<void> {
  return assert(() => fails(cb), `expected to fail - ${ message }`);
}







export function failsSync(cb: () => void): boolean {
  try {
    cb();
    return false;
  } catch (e) {
    return true;
  }
}

export function observableAssert(values: any[], timeout: number = 100, equalFunction: (a: any, b: any) => boolean = eq): [(value: any) => void, Promise<void>] {
  let index: number = 0;
  let resolve: any;
  let reject: any;

  return [
    (value: any) => {
      if (index < values.length) {
        if (equalFunction(value, values[index])) {
          index++;
        } else {
          reject(new Error(`Received value ${ value } (#${ index }), expected ${ values[index] }`));
        }
      } else {
        reject(new Error(`Received more than ${ index } values`));
      }
    },
    Promise.race([
      new Promise<void>((resolve: any) => {
        setTimeout(() => {
          if (index === values.length) {
            resolve();
          } else {
            reject(new Error(`Timeout reached without receiving enough values`));
          }
        }, timeout);
      }),
      new Promise<void>((_resolve: any, _reject: any) => {
        resolve = _resolve;
        reject = _reject;
      })
    ])
  ];
}

export function assertPipe(values: any[], timeout?: number): IPipe<IObserver<any>, IPromiseObservable<void, Error, void>> {
  const [observer, promise] = observableAssert(values, timeout);
  return new Pipe(() => {
    return {
      observer: new Observer<any>(observer),
      observable: new PromiseObservable<void, any, any>(() => promise)
    };
  });
}

export function assertObservableEmits(observable: IObservable<any>, values: any[], timeout?: number): Promise<void> {
  return toPromise<void>(
    observable.pipeThrough(assertPipe(values, timeout))
  );
}

export function assertFunctionObservableEmits(valuesToEmit: any[], observable: IFunctionObservable<(...args: any[]) => void>, values: any[], timeout?: number): Promise<void> {
  const [observer, promise] = observableAssert(values, timeout);
  observable
    .observedBy(new Observer(observer).activate())
    .run(() => {
        for (let i = 0; i < valuesToEmit.length; i++) {
          (observable.args.item(i) as ISource<any>).emit(valuesToEmit[i]);
        }
      });
  return promise;
}



export function assertFailsSync(cb: () => void): void {
  if (!failsSync(cb)) {
    console.log(cb.toString());
    throw new Error(`Expected to fail`);
  }
}
