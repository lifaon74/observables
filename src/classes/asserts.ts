import { IPipe } from '../core/observable-observer/interfaces';
import { IObserver } from '../core/observer/interfaces';
import { IPromiseObservable } from '../notifications/observables/finite-state/promise/promise-observable/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { Observer } from '../core/observer/implementation';
import { PromiseObservable } from '../notifications/observables/finite-state/promise/promise-observable/implementation';
import { IObservable } from '../core/observable/interfaces';
import {
  singleFiniteStateObservableToPromise
} from '../operators/to/toPromise';
import { IFunctionObservable } from '../observables/distinct/function-observable/interfaces';
import { ISource } from '../observables/distinct/source/interfaces';
import { IsObject } from '../helpers';

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
        throw new Error(`Assert failed: ${ message }`);
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

export function notificationsEquals(a: any, b: any): boolean {
  let _a: any;
  let _b: any;

  if (IsObject(a) && ('name' in a) && ('value' in a)) {
    _a = a;
  } else if (Array.isArray(a) && (a.length === 2)) {
    _a = {
      name: a[0],
      value: a[1]
    };
  } else {
    return false;
  }

  if (IsObject(b) && ('name' in b) && ('value' in b)) {
    _b = b;
  } else if (Array.isArray(b) && (b.length === 2)) {
    _b = {
      name: b[0],
      value: b[1]
    };
  } else {
    return false;
  }

  return (_a.name === _b.name)
    && eq(_a.value, _b.value);
}

export function observableAssert(
  values: any[],
  timeout: number = 100,
  equalFunction: (a: any, b: any) => boolean = eq
): { destination: (value: any) => void, promise: Promise<void> } {
  let index: number = 0;
  let resolve: any;
  let reject: any;

  return {
    destination: (value: any) => {
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
    promise: Promise.race([
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
  };
}

export function assertPipe(values: any[], timeout?: number, equalFunction?: (a: any, b: any) => boolean): IPipe<IObserver<any>, IPromiseObservable<void>> {
  const { destination, promise } = observableAssert(values, timeout, equalFunction);
  return new Pipe(() => {
    return {
      observer: new Observer<any>(destination),
      observable: new PromiseObservable<void>(() => promise)
    };
  });
}

export function assertObservableEmits(observable: IObservable<any>, values: any[], timeout?: number, equalFunction?: (a: any, b: any) => boolean): Promise<void> {
  return singleFiniteStateObservableToPromise(
    observable.pipeThrough(assertPipe(values, timeout, equalFunction))
  );
}


export function assertFunctionObservableEmits(valuesToEmit: any[], observable: IFunctionObservable<(...args: any[]) => void>, values: any[], timeout?: number): Promise<void> {
  const { destination, promise } = observableAssert(values, timeout);
  observable
    .observedBy(new Observer(destination).activate())
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
