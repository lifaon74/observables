import { IObservable } from '../core/observable/interfaces';
import { Expression } from '../observables/distinct/expression/implementation';
import { IAsyncFunctionObservable } from '../observables/distinct/function-observable/async/interfaces';
import { AsyncFunctionObservable } from '../observables/distinct/function-observable/async/implementation';
import { IPromiseObservable, } from '../notifications/observables/finite-state/built-in/promise/promise-observable/interfaces';
import { toDistinctValueObservable } from './to/toDistinctValueObservable';
import { IObserver } from '../core/observer/interfaces';
import { Observer } from '../core/observer/public';
import { assertFunctionObservableEmits, assertObservableEmits } from '../classes/asserts';
import { IsObject } from '../helpers';
import { IsObservable } from '../core/observable/constructor';
import { TPipeBase, TPipeContextBase } from '../core/observable-observer/pipe/types';
import { Pipe } from '../core/observable-observer/pipe/implementation';
import { TObservableOrValue } from './shortcuts/types';
import { $observable } from './shortcuts/primitives/$observable';
import { $add } from './shortcuts/arithmetic/$add';
import { $source } from './shortcuts/primitives/$source';
import { $equal } from './shortcuts/comparision/$equal';
import { $function } from './shortcuts/primitives/$function';
import { $expression } from './shortcuts/primitives/$expression';
import { $and } from './shortcuts/logic/$and';
import { ISource } from '../observables/distinct/source/sync/interfaces';
import { Source } from '../observables/distinct/source/sync/implementation';
import { IAdvancedAbortSignal } from '../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { $string } from './shortcuts/others/$string';


export function $async<T>(observable: IPromiseObservable<T>): IObservable<T> {
  return toDistinctValueObservable<T>(observable);
}


// // const myVar = $observables([1, true])[0];
// const myVar = $observables([1, true], $observable<null>(null))[0];
// // const myVar = $observables([(2 as unknown as IObservable<string>)])[0];
// myVar.pipeTo((v: boolean) => {
//
// });


/**** OTHERS ****/


type TFetchFunction<T> = (signal: IAdvancedAbortSignal, requestInfo: RequestInfo, requestInit?: RequestInit) => Promise<T>;

export function $fetch<T>(requestInfo: TObservableOrValue<RequestInfo>, requestInit?: TObservableOrValue<RequestInit | undefined>): IAsyncFunctionObservable<TFetchFunction<T>> {
  return new AsyncFunctionObservable<TFetchFunction<T>>(_fetch, [$observable(requestInfo), $observable<RequestInit | undefined>(requestInit)]);
}

export function _fetch<T>(signal: IAdvancedAbortSignal, requestInfo: RequestInfo, requestInit?: RequestInit): Promise<T> {
  return signal.wrapPromise<Response, 'never', never>(fetch(...signal.wrapFetchArguments(requestInfo, requestInit)))
    .then((response: Response): Promise<T> => {
      return response.json();
    });
}


/*** EXPERIMENTAL ***/

export function $property<TOutput>(input: TObservableOrValue<any>, ...propertyNames: PropertyKey[]): IObservable<TOutput> {
  const observable: IObservable<any> = IsObservable(input)
    ? input
    : new Source<any>().emit(input);

  if (propertyNames.length === 0) {
    return observable;
  } else {
    const propertyName: PropertyKey = propertyNames[0];

    const pipe: TPipeBase<any, any> = Pipe.create<any, any>((context: TPipeContextBase<any, any>) => {
      const valueObserver: IObserver<any> = new Observer<any>((value: any) => {
        context.emit(value);
      });

      return {
        onEmit: (input: any) => {
          if (IsObject(input)) {
            const value: any = (input as any)[propertyName];
            if (IsObservable(value)) {
              valueObserver.disconnect();
              // console.log('observing', value);
              context.emit(void 0); // emits undefined because path is potentially invalid
              valueObserver.observe(value);
            } else {
              context.emit(value);
            }
          } else {
            context.emit(void 0); // emits undefined because input is not an object so path becomes invalid
          }
        },
        onObserved(): void {
          if (context.pipe.observable.observers.length === 1) {
            valueObserver.activate();
          }
        },
        onUnobserved(): void {
          if (!context.pipe.observable.observed) {
            valueObserver.deactivate();
          }
        },
      };
    });

    pipe.observer.observe(observable);

    return $property<TOutput>(pipe.observable, ...propertyNames.slice(1));
  }

}


export type TValueToDeepSource<T> =
  T extends IObservable<any>
    ? T
    : ISource<T extends object
    ? {
      [K in keyof T]: TValueToDeepSource<T[K]>;
    }
    : T>;

export function ValueToDeepSource<T>(input: TObservableOrValue<T>): TValueToDeepSource<T> {
  if (IsObservable(input)) {
    return input as TValueToDeepSource<T>;
  } else if (IsObject(input)) {
    const keys: PropertyKey[] = (Object.keys(input) as PropertyKey[]).concat(Object.getOwnPropertySymbols(input));
    const output: any = {};
    for (let i = 0, l = keys.length; i < l; i++) {
      output[keys[i]] = ValueToDeepSource<any>((input as any)[keys[i]]);
    }
    return new Source<any>().emit(output) as any;
  } else {
    return new Source<any>().emit(input) as any;
  }
}


async function test$property(): Promise<void> {
  // type OBJECT = {
  //   a1: {
  //     b1: 'a1-b1',
  //     b2: {
  //       c1: 'a1-b2-c1'
  //     }
  //   }
  // };

  type OBJECT = {
    a1?: {
      b1?: string,
      b2?: {
        c1?: string
      }
    }
    a?: string
  };

  const object: OBJECT = {
    a1: {
      b1: 'a1-b1',
      b2: {
        c1: 'a1-b2-c1'
      }
    }
  };

  const observableObject = ValueToDeepSource<OBJECT>(object);
  // const b: TObservableOrValueToValueType<IObservable<number>>;
  //
  const a = $property<string>(observableObject, 'a1', 'b1')
  // const a = $property<string>(observableObject.a1, 'b1')
  //   .pipeThrough(distinctPipe<string>())
    .pipeTo((value: string) => {
      console.warn('changed', value);
    }).activate();

  /**
   * LIMITS: emitted values are not reflected on the object
   */
  // (observableObject.value as any).a1.emit(ValueToDeepSource({ b1: 'a1-b1-v2' }).value);
  // observableObject.emit(ValueToDeepSource({ a: 'a' }).value);
  // observableObject.emit(ValueToDeepSource({ a1: { b1: 'a1-b1-v3' } }).value);
  // console.log(observableObject.value.a1.value.b1.value);
}


export async function testMisc(): Promise<void> {
  await test$property();

  await assertObservableEmits(
    new Source<any>().emit(1),
    [1]
  );

  await assertObservableEmits(
    new Expression<any>(() => 1),
    [1]
  );

  await assertObservableEmits(
    $source(1),
    [1]
  );

  await assertObservableEmits(
    $function((a: number, b: number) => (a + b), [$expression(() => 1), $source(2)]),
    [Number.NaN, 3]
  );

  await assertObservableEmits(
    $function((a: number, b: number) => (a + b), [$source(1), $source(2)]),
    [Number.NaN, 3]
  );

  await assertFunctionObservableEmits(
    [1, 2],
    $function((a: number, b: number) => (a + b), [$source<number>(), $source<number>()]),
    [3]
  );

  await assertObservableEmits(
    $equal($source(1), $source(2)),
    [false]
  );

  await assertObservableEmits(
    $equal($source(1), $source(1)),
    [false, true]
  );

  await assertFunctionObservableEmits(
    [1, 1],
    $equal($source(), $source()),
    [true]
  );

  await assertFunctionObservableEmits(
    [1, 2, 3],
    $add($source<number>(), $source<number>(), $source<number>()),
    [6]
  );


  await assertFunctionObservableEmits(
    [true, true, true],
    $and($source<boolean>(), $source<boolean>(), $source<boolean>()),
    [true]
  );

  await assertFunctionObservableEmits(
    [true, true, false],
    $and($source<boolean>(), $source<boolean>(), $source<boolean>()),
    [false]
  );


  await assertFunctionObservableEmits(
    [1, true],
    $string`value 0: ${ $source() }, value 1: ${ $source() }`,
    [`value 0: ${ 1 }, value 1: ${ true }`]
  );

  // $async();

  console.log('test passed with success');
}
