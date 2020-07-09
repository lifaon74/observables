export async function ArrayFromAsyncIterator<T>(
  iterator: AsyncIterator<T>,
  maxLength: number = Number.POSITIVE_INFINITY
): Promise<T[]> {
  const values: T[] = [];
  let result: IteratorResult<T>;
  let i: number = 0;
  while ((i < maxLength) && !(result = await iterator.next()).done) {
    values.push(result.value);
    i++;
  }
  return values;
}

export function ArrayFromAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  return ArrayFromAsyncIterator<T>(iterable[Symbol.iterator]());
}
