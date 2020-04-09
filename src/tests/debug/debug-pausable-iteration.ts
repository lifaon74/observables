import { $delay } from '../../promises/cancellable-promise/snipets';
import { PausableAsyncIteration, PausableSyncIteration } from '../../misc/helpers/iterators/pausable-iteration';


export async function debugPausableAsyncIteration() {
  const generator = async function * () {
    for (let i = 0; i < 10; i++) {
      await $delay(500);
      yield i;
      if (i > 5) {
        throw new Error('end me');
      }
    }
  };


  const iteration = PausableAsyncIteration(
    generator(),
    (value: any) => {
      console.log('next', value);
      if (value > 5) {
        iteration.pause();
        setTimeout(() => {
          iteration.resume();
        }, 3000);
      }
    },
    () => {
      console.log('complete');
    },
    (reason: any) => {
      console.log('error', reason);
    },
  );

  iteration.resume();

  setTimeout(() => {
    iteration.pause();

    setTimeout(() => {
      iteration.resume();
    }, 3000);
  }, 1600);
}

export async function debugPausableSyncIteration() {
  const generator = function * () {
    for (let i = 0; i < 10; i++) {
      yield i;
      if (i > 5) {
        throw new Error('end me');
      }
    }
  };


  const iteration = PausableSyncIteration(
    generator(),
    (value: any) => {
      console.log('next', value);
      if (value > 5) {
        iteration.pause();
        setTimeout(() => {
          iteration.resume();
        }, 3000);
      }
    },
    () => {
      console.log('complete');
    },
    (reason: any) => {
      console.log('error', reason);
    },
  );

  iteration.resume();
}

export async function debugPausableIteration() {
  // await debugPausableAsyncIteration();
  await debugPausableSyncIteration();
}

