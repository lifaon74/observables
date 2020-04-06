import { IsObject } from '../../../../helpers';

export function IsIterable(value: any): value is Iterable<any> {
  return IsObject(value)
    && (Symbol.iterator in value);
}
