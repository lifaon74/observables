import { IAsyncSource, ISource } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { ICancelToken } from '../../../misc/cancel-token/interfaces';
import {
  DistinctValueObservable
} from '../distinct-value-observable/implementation';
import {
  AsyncDistinctValueObservable
} from '../distinct-async-value-observable/implementation';
import { IsObject } from '../../../helpers';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import {
  DISTINCT_VALUE_OBSERVABLE_PRIVATE, IDistinctValueObservableInternal
} from '../distinct-value-observable/privates';
import { IDistinctValueObservableContext } from '../distinct-value-observable/context/interfaces';
import { IAsyncDistinctValueObservableContext } from '../distinct-async-value-observable/context/interfaces';
import {
  DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE, IAsyncDistinctValueObservableInternal
} from '../distinct-async-value-observable/privates';


export const SOURCE_PRIVATE = Symbol('source-private');

export interface ISourcePrivate<T> {
  context: IDistinctValueObservableContext<T>;
}

export interface ISourceInternal<T> extends ISource<T>, IDistinctValueObservableInternal<T> {
  [SOURCE_PRIVATE]: ISourcePrivate<T>;
}


export function ConstructSource<T>(source: ISource<T>, context: IObservableContext<T>): void {
  ConstructClassWithPrivateMembers(source, SOURCE_PRIVATE);
  (source as ISourceInternal<T>)[SOURCE_PRIVATE].context = context;
}

export function IsSource(value: any): value is ISource<any> {
  return IsObject(value)
    && value.hasOwnProperty(SOURCE_PRIVATE as symbol);
}

export function SourceEmit<T>(source: ISource<T>, value: T): void {
  (source as ISourceInternal<T>)[SOURCE_PRIVATE].context.emit(value);
}


export class Source<T> extends DistinctValueObservable<T> implements ISource<T> {
  constructor() {
    let context: IDistinctValueObservableContext<T>;
    super((_context: IDistinctValueObservableContext<T>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructSource<T>(this, context);
  }

  get value(): T | undefined {
    return ((this as unknown) as ISourceInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE].value;
  }

  valueOf(): T | undefined {
    return ((this as unknown) as ISourceInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE].value;
  }

  emit(value: T): this {
    SourceEmit<T>(this, value);
    return this;
  }
}


/*--------------------------*/


export const ASYNC_SOURCE_PRIVATE = Symbol('async-source-private');

export interface IAsyncSourcePrivate<T> {
  context: IAsyncDistinctValueObservableContext<T>;
}

export interface IAsyncSourceInternal<T> extends IAsyncSource<T>, IAsyncDistinctValueObservableInternal<T> {
  [ASYNC_SOURCE_PRIVATE]: IAsyncSourcePrivate<T>;
}

export function ConstructAsyncSource<T>(source: IAsyncSource<T>, context: IAsyncDistinctValueObservableContext<T>): void {
  ConstructClassWithPrivateMembers(source, ASYNC_SOURCE_PRIVATE);
  (source as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context = context;
}


export function AsyncSourceEmit<T, S extends IAsyncSource<T>>(source: S, promise: Promise<T>, token?: ICancelToken): Promise<S> {
  return ((source as unknown) as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context.emit(promise, token)
    .then(() => source);
}


export class AsyncSource<T> extends AsyncDistinctValueObservable<T> implements IAsyncSource<T> {
  constructor() {
    let context: IAsyncDistinctValueObservableContext<T>;
    super((_context: IAsyncDistinctValueObservableContext<T>) => {
      context = _context;
    });
    // @ts-ignore
    ConstructAsyncSource<T>(this, context);
  }

  get promise(): Promise<T> | null {
    return ((this as unknown) as IAsyncSourceInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE].promise;
  }

  get token(): ICancelToken | null {
    return ((this as unknown) as IAsyncSourceInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE].token;
  }

  emit(promise: Promise<T>, token?: ICancelToken): Promise<this> {
    return AsyncSourceEmit<T, this>(this, promise, token);
  }
}




