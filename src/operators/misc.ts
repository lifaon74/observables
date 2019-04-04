import { SourceFunctionObservable } from '../observables/function-observable/implementation';
import { ISource } from '../observables/source/interfaces';
import { Source } from '../observables/source/implementation';
import { ISourceFunctionObservable, SourceCastTuple, SourceOrValueCastTuple, TFunctionObservableFactory } from '../observables/function-observable/interfaces';
import { Pipe } from '../core/observable-observer/implementation';
import { INotificationsObserver } from '../notifications/core/notifications-observer/interfaces';
import { NotificationsObserver } from '../notifications/core/notifications-observer/implementation';
import { SourceAsyncFunctionObservable } from '../observables/async-function-observable/implementation';
import { IPromiseCancelToken } from '../notifications/observables/promise-observable/promise-cancel-token/interfaces';

type TSourceOrValue<T> = ISource<T> | T;

/**
 * Casts an input to a source.
 * @Example:
 *  - $source(1) => Source with value 1
 *  - $source(source1) => returns source1 if "source1" is already a Source
 * @param input
 */
export function $source<T>(input: TSourceOrValue<T>): ISource<T> {
  return (input instanceof Source) ? input : new Source<T>().emit(input as T);
}

/**
 * Cast a list of inputs as a list of Source
 * @param inputs
 */
export function $sources<T extends any[]>(inputs: T): SourceCastTuple<T> {
  return inputs.map(_ => $source(_)) as any;
}


/**
 * Creates a SourceFunctionObservable from a factory and some inputs
 * @param factory
 * @param args
 */
export function $fnc<T extends TFunctionObservableFactory>(factory: T, args: SourceOrValueCastTuple<Parameters<T>>): ISourceFunctionObservable<T> {
  return new SourceFunctionObservable(factory, $sources(args) as SourceCastTuple<Parameters<T>>);
}



/**** COMPARISION ****/

export function $equal(value1: TSourceOrValue<any>, value2: TSourceOrValue<any>): ISourceFunctionObservable<typeof equal> {
  return new SourceFunctionObservable(equal, [$source(value1), $source(value2)]);
  // return $fnc(equal, [value1, value2]);
}

function equal(a: any, b: any): boolean {
  return a === b;
}


export function $notEqual(value1: TSourceOrValue<any>, value2: TSourceOrValue<any>): ISourceFunctionObservable<typeof notEqual> {
  return new SourceFunctionObservable(notEqual, [$source(value1), $source(value2)]);
}

function notEqual(a: any, b: any): boolean {
  return a !== b;
}



/**** ARITHMETIC ****/


export function $add(...values: TSourceOrValue<number>[]): ISourceFunctionObservable<typeof add> {
  if (values.length > 1) {
    return new SourceFunctionObservable(add, $sources(values));
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


export function $subtract(...values: TSourceOrValue<number>[]): ISourceFunctionObservable<typeof subtract> {
  if (values.length > 1) {
    return new SourceFunctionObservable(subtract, $sources(values));
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


export function $multiply(value1: TSourceOrValue<number>, value2: TSourceOrValue<number>): ISourceFunctionObservable<typeof multiply> {
  return new SourceFunctionObservable(multiply, [$source(value1), $source(value2)]);
}

function multiply(value1: number, value2: number): number {
  return value1 * value2;
}


export function $divide(value1: TSourceOrValue<number>, value2: TSourceOrValue<number>): ISourceFunctionObservable<typeof divide> {
  return new SourceFunctionObservable(divide, [$source(value1), $source(value2)]);
}

function divide(value1: number, value2: number): number {
  return value1 / value2;
}


/**** LOGIC ****/

export function $and(...values: TSourceOrValue<boolean>[]): ISourceFunctionObservable<typeof and> {
  if (values.length > 1) {
    return new SourceFunctionObservable(and, $sources(values));
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


export function $or(...values: TSourceOrValue<boolean>[]): ISourceFunctionObservable<typeof or> {
  if (values.length > 1) {
    return new SourceFunctionObservable(or, $sources(values));
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


export function $not(value: TSourceOrValue<boolean>): ISourceFunctionObservable<typeof not> {
  return new SourceFunctionObservable(not, [$source(value)]);
}

function not(value: boolean): boolean {
  return !value;
}



/**
 * Creates a SourceFunctionObservable from a string template.
 * @Example:
 *  - $string`a${source1}b${source2}c`
 * @param parts
 * @param args
 */
export function $string(parts: TemplateStringsArray, ...args: TSourceOrValue<any>[]): ISourceFunctionObservable<(...values: any[]) => string> {
  const lengthMinusOne: number = parts.length - 1;
  return new SourceFunctionObservable((...values: any[]) => {
    let str: string = '';
    for (let i = 0; i < lengthMinusOne; i++) {
      str += parts[i] + values[i];
    }
    return str + parts[lengthMinusOne];
  }, $sources(args));
}









