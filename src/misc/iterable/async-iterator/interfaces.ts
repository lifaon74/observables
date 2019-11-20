import { IteratorResult } from '../interfaces';

export type TAsyncIteratorNextCallback<T, U> = (value: U) => (Promise<IteratorResult<T>> | IteratorResult<T>);

export type TAsyncIteratorConstructorArgs<T, U> = [TAsyncIteratorNextCallback<T, U>];


export interface IAsyncIteratorConstructor {
  new<T, U>(next: TAsyncIteratorNextCallback<T, U>): IAsyncIterator<T, U>;
}

export interface IAsyncIterator<T, U> /*extends AsyncIterableIterator<T | undefined>*/
{
  readonly done: boolean;

  next(value: U): Promise<IteratorResult<T>>;

  return(value: T): Promise<IteratorResult<T>>;

  throw(error: any): Promise<IteratorResult<T>>;

  [Symbol.asyncIterator](): AsyncIterableIterator<T>;
}



