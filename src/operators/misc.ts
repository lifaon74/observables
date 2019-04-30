import { FunctionObservable } from '../observables/distinct/function-observable/implementation';
import { IsSource, Source } from '../observables/distinct/source/implementation';
import {
  IFunctionObservable, ObservableCastTuple,
  TFunctionObservableFactory, TFunctionObservableFactoryParameters, TFunctionObservableParameters, TFunctionObservableValue,
} from '../observables/distinct/function-observable/interfaces';
import { IsObservable, Observable } from '../core/observable/implementation';
import { IObservable, IObservableContext } from '../core/observable/interfaces';
import { Expression, IsExpression } from '../observables/distinct/expression/implementation';
import { IExpression } from '../observables/distinct/expression/interfaces';
import { ISource } from '../observables/distinct/source/interfaces';
import {
  IAsyncFunctionObservable,
  TAsyncFunctionObservableFactory,
  TAsyncFunctionObservableFactoryParameters
} from '../observables/distinct/async-function-observable/interfaces';
import { AsyncFunctionObservable } from '../observables/distinct/async-function-observable/implementation';
import {
  IPromiseObservable,
} from '../notifications/observables/promise-observable/interfaces';
import { toValueObservable } from './promise/toValueObservable';
import { IPromiseCancelToken } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { IPipe, IPipeContext, TPipeBase, TPipeContextBase } from '../core/observable-observer/interfaces';
import { IObserver, ObserverType } from '../core/observer/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { IsObserver, Observer } from '../core/observer/public';
import { PromiseObservable } from '../notifications/observables/promise-observable/implementation';
import { toPromise } from './promise/toPromise';
import { assertFunctionObservableEmits, assertObservableEmits } from '../classes/asserts';
import { isObservable } from 'rxjs';
import { IsObject } from '../helpers';
import { Clone, TObject, TupleArray, TupleShift } from '../classes/types';
import { generatePathOfType, PathOf } from '../classes/path-of';
import { distinctPipe } from './pipes/distinctPipe';
import { TupleTypes } from '../misc/readonly-list/interfaces';

export type TObservableOrValue<T> = IObservable<T> | T;
export type TObservableOrValueToValueType<T extends TObservableOrValue<any>> = T extends IObservable<infer R> ? R : T;
export type TObserverOrCallback<T> = IObserver<T> | ((value: T) => void);
export type TSourceOrValue<T> = ISource<T> | T;
export type TExpressionOrFunction<T> = IExpression<T> | (() => T);

export type TObservableOrValues<T extends any[]> = {
  [K in keyof T]: TObservableOrValue<T[K]>;
};

export type TObservableOrValuesNonStrict<T extends any[]> = Array<any> & TObservableOrValues<T>;


export type CastToObservable<T> = (T extends IObservable<any> ? T : IObservable<T>);


// export type CastToObservablesTuple<T extends ([any, boolean] | Any)[]> = {
//   // [K in keyof T]: T[K] extends IObservable<any> ? T[K] : IObservable<T[K] extends [infer V, boolean] ? V : T[K]>;
//   [K in keyof T]: T[K] extends [infer V, boolean]
//     ? CastToObservable<V>
//     : CastToObservable<T[K]>;
// };

export type CastToObservables<T extends any[]> = {
  [K in keyof T]: CastToObservable<T[K]>;
};












export function $observable<T>(input: TObservableOrValue<T>): IObservable<T> {
  return IsObservable(input)
    ? input
    : new Source<T>().emit(input as T);
}

export function $observer<T>(input: TObserverOrCallback<T>): IObserver<T> {
  return IsObserver(input)
    ? input
    : new Observer<T>(input as (value: T) => void);
}

// export function $observables<T extends ([any, boolean] | Any)[]>(...inputs: T): CastToObservablesTuple<T> {
export function $observables<T extends any[]>(...inputs: T): CastToObservables<T> {
  return inputs.map(_ => $observable(_)) as any;
}


export function $source<T>(input: TSourceOrValue<T> = void 0): ISource<T> {
  if (IsSource(input)) {
    return input;
  } else if (IsObservable(input)) {
    throw new Error(`Cannot convert an input of type Observable to a Source`);
  } else {
    return new Source<T>().emit(input as T);
  }
}

export function $expression<T>(input: TExpressionOrFunction<T>): IExpression<T> {
  if (IsExpression(input)) {
    return input;
  } else if (typeof input === 'function') {
    return new Expression<T>(input);
  } else {
    throw new TypeError(`Expected Expression or function as input`);
  }
}





/**
 * Creates a FunctionObservable from a factory and some inputs
 * @param factory
 * @param args
 */
export function $function<T extends TFunctionObservableFactory>(factory: T, args: TObservableOrValues<TFunctionObservableFactoryParameters<T>>): IFunctionObservable<T> {
  return new FunctionObservable(factory, $observables(...args as any) as any);
}


export function $asyncFunction<T extends TAsyncFunctionObservableFactory>(factory: T, args: TObservableOrValue<TAsyncFunctionObservableFactoryParameters<T>>): IAsyncFunctionObservable<T> {
  return new AsyncFunctionObservable(factory, $observables(...args as any) as any);
}

export function $async<T>(observable: IPromiseObservable<T, any, any>): IObservable<T> {
  return toValueObservable<T>(observable);
}



// // const myVar = $observables([1, true])[0];
// const myVar = $observables([1, true], $observable<null>(null))[0];
// // const myVar = $observables([(2 as unknown as IObservable<string>)])[0];
// myVar.pipeTo((v: boolean) => {
//
// });



/**** COMPARISION ****/

export function $equal(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof equal> {
  return new FunctionObservable(equal, [$observable(value1), $observable(value2)]);
  // return $fnc(equal, [value1, value2]);
}

function equal(a: any, b: any): boolean {
  return a === b;
}


export function $notEqual(value1: TObservableOrValue<any>, value2: TObservableOrValue<any>): IFunctionObservable<typeof notEqual> {
  return new FunctionObservable(notEqual, [$observable(value1), $observable(value2)]);
}

function notEqual(a: any, b: any): boolean {
  return a !== b;
}


/**** ARITHMETIC ****/


export function $add(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof add> {
  if (values.length > 1) {
    return new FunctionObservable(add, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $add`);
  }
}

function add(...values: number[]): number {
  let sum: number = 0;
  for (let i = 0, l = values.length; i < l; i++) {
    sum += values[i];
  }
  return sum;
}


export function $subtract(...values: TObservableOrValue<number>[]): IFunctionObservable<typeof subtract> {
  if (values.length > 1) {
    return new FunctionObservable(subtract, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $subtract`);
  }
}

function subtract(...values: number[]): number {
  let value: number = values[0];
  for (let i = 1, l = values.length; i < l; i++) {
    value -= values[i];
  }
  return value;
}


export function $multiply(value1: TObservableOrValue<number>, value2: TObservableOrValue<number>): IFunctionObservable<typeof multiply> {
  return new FunctionObservable(multiply, [$observable(value1), $observable(value2)]);
}

function multiply(value1: number, value2: number): number {
  return value1 * value2;
}


export function $divide(value1: TObservableOrValue<number>, value2: TObservableOrValue<number>): IFunctionObservable<typeof divide> {
  return new FunctionObservable(divide, [$observable(value1), $observable(value2)]);
}

function divide(value1: number, value2: number): number {
  return value1 / value2;
}


/**** LOGIC ****/

export function $and(...values: TObservableOrValue<boolean>[]): IFunctionObservable<typeof and> {
  if (values.length > 1) {
    return new FunctionObservable(and, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $and`);
  }
}

function and(...values: boolean[]): boolean {
  for (let i = 0, l = values.length; i < l; i++) {
    if (!values[i]) {
      return false;
    }
  }
  return true;
}


export function $or(...values: TObservableOrValue<boolean>[]): IFunctionObservable<typeof or> {
  if (values.length > 1) {
    return new FunctionObservable(or, $observables(...values));
  } else {
    throw new TypeError(`Expected at least 2 arguments for $or`);
  }
}

function or(...values: boolean[]): boolean {
  for (let i = 0, l = values.length; i < l; i++) {
    if (values[i]) {
      return true;
    }
  }
  return false;
}


export function $not(value: TObservableOrValue<boolean>): IFunctionObservable<typeof not> {
  return new FunctionObservable(not, [$observable(value)]);
}

function not(value: boolean): boolean {
  return !value;
}


/**** OTHERS ****/

/**
 * Creates a FunctionObservable from a string template.
 * @Example:
 *  - $string`a${source1}b${source2}c`
 * @param parts - TemplateStringsArray
 * @param args
 */
export function $string(parts: TemplateStringsArray | string[], ...args: TObservableOrValue<any>[]): IFunctionObservable<(...values: any[]) => string> {
  const lengthMinusOne: number = parts.length - 1;
  return new FunctionObservable((...values: any[]) => {
    let str: string = '';
    for (let i = 0; i < lengthMinusOne; i++) {
      str += parts[i] + values[i];
    }
    return str + parts[lengthMinusOne];
  }, $observables(...args));
}


export function $fetch<T>(requestInfo: TObservableOrValue<RequestInfo>, requestInit?: TObservableOrValue<RequestInit>): IAsyncFunctionObservable<(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit: RequestInit) => Promise<T>> {
  return new AsyncFunctionObservable<(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit: RequestInit) => Promise<T>>(_fetch, [$observable(requestInfo), $observable(requestInit)]);
}

export function _fetch<T>(token: IPromiseCancelToken, requestInfo: RequestInfo, requestInit: RequestInit): Promise<T> {
  // TODO token as signal
  return fetch(requestInfo, requestInit)
    .then<T>((response: Response) =>{
      if (token.cancelled) {
        throw token.reason;
      } else {
        return response.json();
      }
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
    : ISource<
        T extends object
        ? {
          [K in keyof T]: TValueToDeepSource<T[K]>;
        }
        : T
      >;

export function ValueToDeepSource<T>(input: TObservableOrValue<T>): TValueToDeepSource<T> {
  if (IsObservable(input)) {
    return input as TValueToDeepSource<T>;
  } else if (IsObject(input)) {
    const keys: PropertyKey[] = (Object.keys(input) as PropertyKey[]).concat(Object.getOwnPropertySymbols(input));
    const output: any = {};
    for (let i = 0, l = keys.length; i < l; i++) {
      output[keys[i]] = new Source<any>().emit(ValueToDeepSource<any>((input as any)[keys[i]]));
    }
    return new Source<any>().emit(output) as any;
  } else {
    return new Source<any>().emit(input) as any;
  }
}


async function test$property(): Promise<void> {
  type OBJECT = {
    a1: {
      b1: 'a1-b1',
      b2: {
        c1: 'a1-b2-c1'
      }
    }
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
    // .pipeThrough(distinctPipe<string>())
    .pipeTo((value: string) => {
      console.warn('changed', value);
    }).activate();

  /**
   * LIMITS: emitted values are not reflected on the object
   */
  // observableObject.value.a1.emit({ b1: 'a1-b1-v2' });
  // observableObject.emit({ a: 'a' });
  // observableObject.emit(ValueToDeepSource<any>({ a1: { b1: 'a1-b1-v3' }}).value); // doesnt work
}



export async function testMisc(): Promise<void> {
  // await test$property();

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
    $function((a: number, b: number) => (a + b), [$source(), $source()]),
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
    $add($source(), $source(), $source()),
    [6]
  );


  await assertFunctionObservableEmits(
    [true, true, true],
    $and($source(), $source(), $source()),
    [true]
  );

  await assertFunctionObservableEmits(
    [true, true, false],
    $and($source(), $source(), $source()),
    [false]
  );


  await assertFunctionObservableEmits(
    [1, true],
    $string`value 0: ${$source()}, value 1: ${$source()}`,
    [`value 0: ${1}, value 1: ${true}`]
  );

  // $async();

  console.log('test passed with success');
}
