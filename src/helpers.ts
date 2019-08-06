import { setImmediate } from './classes/set-immediate';

export function noop() {
}

export function EnumToString<T>(values: T[]): string {
  let string: string = '';
  for (let i = 0, l = values.length; i < l; i++) {
    if (i > 0) {
      string += (i === (l - 1)) ? ' or ' : ',';
    }
    string += `'${ values[i] }'`;
  }
  return string;
}

export function StringMaxLength(input: string, maxLength: number): string {
  if (maxLength < 3) {
    throw new RangeError(`Expected maxLength greater or equal to 3`);
  }
  return (input.length > maxLength)
    ? (input.substring(0, maxLength - 3) + '...')
    : input;
}

export function MathClosestTo(targetValue: number, ...values: number[]): number {
  let closest: number = values[0];
  let closestDistance: number = Math.abs(values[0] - targetValue);

  let distance: number;
  for (let i = 1, l = values.length; i < l; i++) {
    distance = Math.abs(values[i] - targetValue);
    if (distance < closestDistance) {
      closest = values[i];
      closestDistance = distance;
    }
  }
  return closest;
}

export function IsObject(value: any): value is object {
  return (typeof value === 'object') && (value !== null);
}

export function IsArray(value: any): value is Iterable<any> {
  return Array.isArray(value);
}

export function IsIterable(value: any): value is Iterable<any> {
  return IsObject(value)
    && (Symbol.iterator in value);
}

export function IsIterator(value: any): value is Iterable<any> {
  return IsObject(value)
    && (typeof (value as any).next === 'function');
}

export function IsNullOrUndefined(value: any): value is (null | undefined) {
  return (value === null) || (value === void 0);
}

export type TCastableToIterableStrict<T> = Iterable<T> | Iterator<T>;
export type TCastableToIterable<T> = TCastableToIterableStrict<T> | object;
export type TCastableToIteratorStrict<T> = Iterable<T> | Iterator<T>;
export type TCastableToIterator<T> = TCastableToIteratorStrict<T> | object;

export function ToIterable<T>(value: any): Iterable<T> {
  // return Array.from(value);
  if (IsNullOrUndefined(value)) {
    throw new TypeError(`Cannot cast value to an Iterable`);
  } else if (Symbol.iterator in value) {
    return value;
  } else if (typeof value === 'object') {
    if (typeof value.next === 'function') {
      return function * () {
        const iterator: Iterator<T> = value;
        let result: IteratorResult<T>;
        while (!(result = iterator.next()).done) {
          yield result.value;
        }
      }();
    } else {
      return Object.entries(value) as unknown as Iterable<T>;
    }
  } else {
    throw new TypeError(`Cannot cast value to an Iterable`);
  }
}

export function ToIterator<T>(value: any): Iterator<T> {
  if (IsNullOrUndefined(value)) {
    throw new TypeError(`Cannot cast value to an iterable`);
  } else if (Symbol.iterator in value) {
    return value[Symbol.iterator]();
  } else if (typeof value === 'object') {
    if (typeof value.next === 'function') {
      return value;
    } else {
      return Object.entries(value)[Symbol.iterator]() as unknown as Iterator<T>;
    }
  } else {
    throw new TypeError(`Cannot cast value to an Iterator`);
  }
}


export function UntilDefined<T>(
  callback: () => (T | undefined),
  onDefined: (value: T) => void,
  count: number = 1
): void {
  if (count >= 0) {
    const value: T | undefined = callback();
    if (value === void 0) {
      setImmediate(() => {
        UntilDefined<T>(callback, onDefined, count - 1);
      });
    } else {
      onDefined(value);
    }
  }
}
