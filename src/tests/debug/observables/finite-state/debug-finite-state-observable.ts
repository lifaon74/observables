import { FromIterableObservable } from '../../../../notifications/observables/finite-state/built-in/from/iterable/implementation';
import { $delay } from '../../../../promises/cancellable-promise/snipets';
import { finiteStateObservableToPromise } from '../../../../operators/to/toPromise';
import { toAsyncIterable } from '../../../../operators/to/toAsyncIterable';
import { PromiseObservable } from '../../../../notifications/observables/finite-state/built-in/promise/promise-observable/implementation';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { TFiniteStateObservableGeneric } from '../../../../notifications/observables/finite-state/types';
import { RunParallelFiniteStateObservables } from '../../../../notifications/observables/finite-state/built-in/helpers/parallel/functions';
import { RunSequentialFiniteStateObservables } from '../../../../notifications/observables/finite-state/built-in/helpers/sequencial/functions';

async function * GenerateIterableObservable(start: number, end: number, delay: number, debug: boolean = true): AsyncGenerator<number> {
  for (let i: number = start; i < end; i++) {
    await $delay(delay);
    if (debug) {
      console.log('yielding', i);
    }
    yield i;
  }
}


function logFiniteStateObservable<TObservable extends TFiniteStateObservableGeneric>(observable: TObservable): TObservable {
  return observable
    .on('complete', () => {
      console.log('complete');
    })
    .on('error', (error: any) => {
      console.log('error', error);
    })
    .on('next', (value: number) => {
      console.log('next', value);
    });
}

async function debugFiniteStateObservableToPromise() {
  const asyncIterator = GenerateIterableObservable(0, 10, 1000);

  const observable = new FromIterableObservable(asyncIterator, { mode: 'cache-per-observer' });
  logFiniteStateObservable(observable);

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

  for await (const value of toAsyncIterable(observable)) {
    console.log('value', value);
  }
}

async function debugFiniteStateObservableFromPromiseObservable() {
  const observable = new PromiseObservable((signal: IAdvancedAbortSignal) => {
    console.log('delay started');
    signal.on('abort', () => {
      console.log('aborted');
    });
    return $delay(1000, { signal });
  });

  logFiniteStateObservable(observable as any);

  observable.clearObservers();
}


/**
 * INFO: not sure it makes sense to parallelize / sequence FiniteStateObservable because the 'next' is not pertinent.
 *
 * IDEA: may introduce a GroupFiniteStateObservable(observables: Iterable<IFinite...>, { mode: 'sequential' | 'parallel'})
 *  - next => [Observable, value]
 */
async function debugFiniteStateObservableParallel() {
  const observable1 = new FromIterableObservable(GenerateIterableObservable(0, 10, 100), { mode: 'cache-per-observer' });
  const observable2 = new FromIterableObservable(GenerateIterableObservable(10, 20, 100), { mode: 'cache-per-observer' });

  const observable = RunParallelFiniteStateObservables([observable1, observable2]);
  // const observable = RunSequentialFiniteStateObservables([observable1, observable2]);
  logFiniteStateObservable(observable);

  // observable.clearObservers();
}


async function debugFiniteStateObservableSequential() {
  const observable1 = new PromiseObservable<void>((signal: IAdvancedAbortSignal) => {
    return $delay(1000, { signal });
  });
  const observable2 = new PromiseObservable<void>((signal: IAdvancedAbortSignal) => {
    return $delay(1000, { signal });
  });

  // const observable = RunParallelFiniteStateObservables([observable1, observable2]);
  const observable = RunSequentialFiniteStateObservables([
    observable1,
    observable2
  ]);

  logFiniteStateObservable(observable as any);

  // observable.clearObservers();
}


// async function debugFiniteStateObservableLikeItWasTasks() {
//   const task = RunIn
// }

export async function debugFiniteStateObservable() {
  // await debugFiniteStateObservableToPromise();
  // await debugFiniteStateObservableToAsyncIterator();
  // await debugFiniteStateObservableFromPromiseObservable();
  // await debugFiniteStateObservableParallel();
  await debugFiniteStateObservableSequential();
  // await debugFiniteStateObservableLikeItWasTasks();
}
