import { FromIterableObservable } from '../../../../notifications/observables/finite-state/built-in/from/iterable/implementation';
import { $delay } from '../../../../promises/cancellable-promise/snipets';
import { finiteStateObservableToPromise } from '../../../../operators/to/toPromise';
import { finiteStateObservableToAsyncIterable } from '../../../../operators/to/toAsyncIterable';

async function * GenerateIterableObservable(start: number, end: number, delay: number, debug: boolean = true): AsyncGenerator<number> {
  for (let i: number = start; i < end; i++) {
    await $delay(delay);
    if (debug) {
      console.log('yielding', i);
    }
    yield i;
  }
}

/**
 * TODO continue here
 * - replace Task by FiniteStateObservable
 * - provide examples and use cases
 */
async function debugFiniteStateObservableUsingAsyncIterator() {
  const asyncIterator = GenerateIterableObservable(0, 10, 1000);

  const observable = new FromIterableObservable(asyncIterator, { mode: 'cache-per-observer' })
    .on('complete', () => {
      console.log('complete');
    })
    .on('error', (error: any) => {
      console.log('error', error);
    })
    .on('next', (value: number) => {
      console.log('next', value);
    });


  await $delay(3000);
  const observers = observable.observers.slice();
  observable.clearObservers();
  await $delay(2000);
  observable.observedBy(...observers);

  const values = await finiteStateObservableToPromise(observable);
  console.log(values);
}

async function debugFiniteStateObservableToAsyncIterator() {
  const asyncIterator = GenerateIterableObservable(0, 10, 100);

  const observable = new FromIterableObservable(asyncIterator, { mode: 'cache-per-observer' });

  for await (const value of finiteStateObservableToAsyncIterable(observable)) {
    console.log('value', value);
  }
}

export async function debugFiniteStateObservable() {
  // await debugFiniteStateObservableUsingAsyncIterator();
  await debugFiniteStateObservableToAsyncIterator();
}
