import { IsAsyncIterable } from './is-async-iterable';

export function IsAsyncGenerator(value: any): value is AsyncGenerator<any> {
  return IsAsyncIterable(value)
    && (typeof value['next'] === 'function');
}
