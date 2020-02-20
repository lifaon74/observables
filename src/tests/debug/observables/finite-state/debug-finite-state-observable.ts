import { FromIterableObservable } from '../../../../notifications/observables/finite-state/built-in/from/iterable/implementation';
import { $delay } from '../../../../promises/cancellable-promise/snipets';
import { finiteStateObservableToPromise } from '../../../../operators/to/toPromise';


async function debugFiniteStateObservableUsingAsyncIterator() {
  const asyncIterator = (async function * () {
    for (let i = 0; i < 10; i++) {
      await $delay(1000);
      console.log('yielding', i);
      yield i;
    }
  })();


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


export async function debugFiniteStateObservable() {
  await debugFiniteStateObservableUsingAsyncIterator();
}
