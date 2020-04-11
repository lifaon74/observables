import { $delay } from '../../promises/cancellable-promise/snipets';
import { PausableIteration } from '../../misc/helpers/iterators/pausable-iteration/implementation';


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

  const iteration = new PausableIteration({
    iterable: generator(),
    next: (value: any) => {
      console.log('next', value);
      if (value > 5) {
        iteration.pause();
        setTimeout(() => {
          iteration.run();
        }, 3000);
      }
    },
    complete: () => {
      console.log('complete');
    },
    error: (reason: any) => {
      console.log('error', reason);
    },
  });

  iteration.run();

  setTimeout(() => {
    iteration.pause();

    setTimeout(() => {
      iteration.run();
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


  const iteration = new PausableIteration({
    iterable: generator(),
    next: (value: any) => {
      console.log('next', value);
      if (value > 5) {
        iteration.pause();
        setTimeout(() => {
          iteration.run();
        }, 3000);
      }
    },
    complete: () => {
      console.log('complete');
    },
    error: (reason: any) => {
      console.log('error', reason);
    },
  });

  iteration.run();
}

export async function debugPausableIteration() {
  // await debugPausableAsyncIteration();
  await debugPausableSyncIteration();
}

