import { FromIterableObservable } from '../../../../notifications/observables/finite-state/built-in/from/iterable/implementation';
import { $delay } from '../../../../promises/cancellable-promise/snipets';
import { finiteStateObservableToPromise } from '../../../../operators/to/toPromise';
import { toAsyncIterable } from '../../../../operators/to/toAsyncIterable';

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
async function debugFiniteStateObservableToPromise() {
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

async function debugFiniteStateObservableToAsyncIterator1() {
  const asyncIterator = GenerateIterableObservable(0, 10, 100);

  const observable = new FromIterableObservable(asyncIterator, { mode: 'cache-per-observer' });

  for await (const value of toAsyncIterable(observable)) {
    console.log('value', value);
  }
}

async function debugFiniteStateObservableParallel() {
  const observable1 = new FromIterableObservable(GenerateIterableObservable(0, 10, 100), { mode: 'cache-per-observer' });
  const observable2 = new FromIterableObservable(GenerateIterableObservable(10, 20, 100), { mode: 'cache-per-observer' });

  // observable
  //   .on('complete', () => {
  //     console.log('complete');
  //   })
  //   .on('error', (error: any) => {
  //     console.log('error', error);
  //   })
  //   .on('next', (value: any) => {
  //     console.log('next', value);
  //   });

  // for await (const value of toAsyncIterable(observable)) {
  //   console.log('value', value);
  // }
  // console.log('done');
}


export async function debugFiniteStateObservable() {
  // await debugFiniteStateObservableToPromise();
  // await debugFiniteStateObservableToAsyncIterator();
  await debugFiniteStateObservableParallel();
}
