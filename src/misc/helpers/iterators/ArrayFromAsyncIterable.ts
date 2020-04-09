export async function ArrayFromAsyncIterator<T>(iterator: AsyncIterator<T>): Promise<T[]> {
  const values: T[] = [];
  let result: IteratorResult<T>;
  while (!(result = await iterator.next()).done) {
    values.push(result.value);
  }
  return values;
}

export function ArrayFromAsyncIterable<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  return ArrayFromAsyncIterator<T>(iterable[Symbol.iterator]());
}
