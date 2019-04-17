import { FunctionObservable } from '../observables/distinct/function-observable/implementation';
import { IsSource, Source } from '../observables/distinct/source/implementation';
import {
  IFunctionObservable,
  TFunctionObservableFactory, TFunctionObservableFactoryParameters,
} from '../observables/distinct/function-observable/interfaces';
import { IsObservable } from '../core/observable/implementation';
import { IObservable } from '../core/observable/interfaces';
import { Expression, IsExpression } from '../observables/distinct/expression/implementation';
import { Any } from '../classes/types';
import { IExpression } from '../observables/distinct/expression/interfaces';
import { ISource } from '../observables/distinct/source/interfaces';
import {
  IAsyncFunctionObservable,
  TAsyncFunctionObservableFactory,
  TAsyncFunctionObservableFactoryParameters
} from '../observables/distinct/async-function-observable/interfaces';
import { AsyncFunctionObservable } from '../observables/distinct/async-function-observable/implementation';
import { IPromiseObservable } from '../notifications/observables/promise-observable/interfaces';
import { toValueObservable } from './promise/toValueObservable';
import { Pipe } from '../core/observable-observer/implementation';
import { IPromiseCancelToken } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';

export type TObservableOrValue<T> = IObservable<T> | T;
export type TSourceOrValue<T> = ISource<T> | T;
export type TExpressionOrFunction<T> = IExpression<T> | (() => T);

export type CastToObservable<T> = (T extends IObservable<any> ? T : IObservable<T>);

export type CastToObservablesTuple<T extends ([any, boolean] | Any)[]> = {
  // [K in keyof T]: T[K] extends IObservable<any> ? T[K] : IObservable<T[K] extends [infer V, boolean] ? V : T[K]>;
  [K in keyof T]: T[K] extends [infer V, boolean]
    ? CastToObservable<V>
    : CastToObservable<T[K]>;
};

export type CastToObservables<T extends any[]> = {
  [K in keyof T]: CastToObservable<T[K]>;
};


export function $observable<T>(input: TObservableOrValue<T>): IObservable<T> {
  return IsObservable(input)
    ? input
    : new Source<T>().emit(input as T);
}

// export function $observables<T extends ([any, boolean] | Any)[]>(...inputs: T): CastToObservablesTuple<T> {
export function $observables<T extends any[]>(...inputs: T): CastToObservables<T> {
  return inputs.map(_ => $observable(_)) as any;
}


export function $source<T>(input: TSourceOrValue<T>): ISource<T> {
  if (IsSource(input)) {
    return input;
  } else if (IsObservable(input)) {
    throw new Error(`Cannot convert input which is an Observable to a Source`);
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
export function $function<T extends TFunctionObservableFactory>(factory: T, args: TObservableOrValue<TFunctionObservableFactoryParameters<T>>): IFunctionObservable<T> {
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
 * @param parts
 * @param args
 */
export function $string(parts: TemplateStringsArray, ...args: TObservableOrValue<any>[]): IFunctionObservable<(...values: any[]) => string> {
  const lengthMinusOne: number = parts.length - 1;
  return new FunctionObservable((...values: any[]) => {
    let str: string = '';
    for (let i = 0; i < lengthMinusOne; i++) {
      str += parts[i] + values[i];
    }
    return str + parts[lengthMinusOne];
  }, $observables(...args));
}


// TODO

export function $translate(key: TObservableOrValue<string>, params: TObservableOrValue<any>): IAsyncFunctionObservable<typeof translate> {
  return new AsyncFunctionObservable(translate, [$observable(key), $observable(params)]);
}

// function translate2(key: string, params: any): Promise<string> {
//   return Promise.resolve('translated-' + key);
// }

function translate(token: IPromiseCancelToken, key: string, params: any): Promise<string> {
  return Promise.resolve('translated-' + key);
}




