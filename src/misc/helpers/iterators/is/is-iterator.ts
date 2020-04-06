import { IsObject } from '../../../../helpers';

export function IsIterator(value: any): value is Iterable<any> {
  return IsObject(value)
    && (typeof (value as any).next === 'function');
}
