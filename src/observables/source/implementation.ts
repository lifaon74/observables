import { IObservableContext } from '../../core/observable/interfaces';
import { IAsyncSource, ISource } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IPromiseCancelToken } from '../../notifications/observables/promise-observable/promise-cancel-token/interfaces';
import { IValueObservableInternal, VALUE_OBSERVABLE_PRIVATE, ValueObservable } from '../value-observable/implementation';
import { IValueObservableContext } from '../value-observable/interfaces';
import { IAsyncValueObservableContext } from '../async-value-observable/interfaces';
import { ASYNC_VALUE_OBSERVABLE_PRIVATE, AsyncValueObservable, IAsyncValueObservableInternal } from '../async-value-observable/implementation';


export const SOURCE_PRIVATE = Symbol('source-private');

export interface ISourcePrivate<T> {
  context: IValueObservableContext<T>;
}

export interface ISourceInternal<T> extends ISource<T>, IValueObservableInternal<T> {
  [SOURCE_PRIVATE]: ISourcePrivate<T>;
}


export function ConstructSource<T>(source: ISource<T>, context: IObservableContext<T>): void {
  ConstructClassWithPrivateMembers(source, SOURCE_PRIVATE);
  (source as ISourceInternal<T>)[SOURCE_PRIVATE].context = context;
}

export function SourceEmit<T>(source: ISource<T>, value: T): void {
  (source as ISourceInternal<T>)[SOURCE_PRIVATE].context.emit(value);
}



export class Source<T> extends ValueObservable<T> implements ISource<T> {
  constructor() {
    let context: IValueObservableContext<T> = void 0;
    super((_context: IValueObservableContext<T>) => {
      context = _context;
    });
    ConstructSource<T>(this, context);
  }

  get value(): T {
    return ((this as unknown) as ISourceInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value;
  }

  valueOf(): T {
    return ((this as unknown) as ISourceInternal<T>)[VALUE_OBSERVABLE_PRIVATE].value;
  }

  emit(value: T): this {
    SourceEmit<T>(this, value);
    return this;
  }
}



/*--------------------------*/



export const ASYNC_SOURCE_PRIVATE = Symbol('async-source-private');

export interface IAsyncSourcePrivate<T> {
  context: IAsyncValueObservableContext<T>;
}

export interface IAsyncSourceInternal<T> extends IAsyncSource<T>, IAsyncValueObservableInternal<T> {
  [ASYNC_SOURCE_PRIVATE]: IAsyncSourcePrivate<T>;
}

export function ConstructAsyncSource<T>(source: IAsyncSource<T>, context: IAsyncValueObservableContext<T>): void {
  ConstructClassWithPrivateMembers(source, ASYNC_SOURCE_PRIVATE);
  (source as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context = context;
}


export function AsyncSourceEmit<T, S extends IAsyncSource<T>>(source: S, promise: Promise<T>, token?: IPromiseCancelToken): Promise<S> {
  return ((source as unknown) as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context.emit(promise, token)
    .then(() => source);
}


export class AsyncSource<T> extends AsyncValueObservable<T> implements IAsyncSource<T> {
  constructor() {
    let context: IAsyncValueObservableContext<T> = void 0;
    super((_context: IAsyncValueObservableContext<T>) => {
      context = _context;
    });
    ConstructAsyncSource<T>(this, context);
  }

  get promise(): Promise<T> {
    return ((this as unknown) as IAsyncSourceInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].promise;
  }

  get token(): IPromiseCancelToken | null {
    return ((this as unknown) as IAsyncSourceInternal<T>)[ASYNC_VALUE_OBSERVABLE_PRIVATE].token;
  }

  emit(promise: Promise<T>, token?: IPromiseCancelToken): Promise<this> {
    return AsyncSourceEmit<T, this>(this, promise, token);
  }
}




