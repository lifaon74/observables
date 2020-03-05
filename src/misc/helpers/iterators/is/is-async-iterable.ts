import { IsObject } from '../../../../helpers';

export function IsAsyncIterable(value: any): value is AsyncIterable<any> {
  return IsObject(value)
    && (Symbol.asyncIterator in value);
}
