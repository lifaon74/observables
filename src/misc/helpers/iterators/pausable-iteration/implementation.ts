/** PRIVATES **/
import { IPausableIteration, IPausableIterationOptions, TPausableIterableState } from './interfaces';
import { TSyncOrAsyncIterable, TSyncOrAsyncIterator } from '../interfaces';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';
import { IsObject } from '../../../../helpers';
import { IsAsyncIterable } from '../is/is-async-iterable';
import { IsIterable } from '../is/is-iterable';

/** INTERNAL TYPES **/

type TResultState = 'awaiting' | 'error' | 'value';

/** PRIVATES **/

export const PAUSABLE_ITERATION_PRIVATE = Symbol('pausable-iteration-private');

export interface IPausableIterationPrivate<TValue> {
  iterable: TSyncOrAsyncIterable<TValue>;
  next: (value: TValue) => void;
  complete: () => void;
  error: (reason: any) => void;

  iterator: TSyncOrAsyncIterator<TValue>;
  isAsync: boolean;
  state: TPausableIterableState;

  // async
  pendingUntilRunning: (() => void)[];

  // sync
  result: IteratorResult<TValue> | any;
  resultState: TResultState;
}

export interface IPausableIterationInternal<TValue> extends IPausableIteration<TValue> {
  [PAUSABLE_ITERATION_PRIVATE]: IPausableIterationPrivate<TValue>;
}

/** CONSTRUCTOR **/

export function ConstructPausableIteration<TValue>(
  instance: IPausableIteration<TValue>,
  options: IPausableIterationOptions<TValue>
): void {
  ConstructClassWithPrivateMembers(instance, PAUSABLE_ITERATION_PRIVATE);
  const privates: IPausableIterationPrivate<TValue> = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE];

  if (IsObject(options)) {
    if (IsAsyncIterable(options.iterable)) {
      privates.isAsync = true;
    } else if (IsIterable(options.iterable)) {
      privates.isAsync = false;
    } else {
      throw new TypeError(`Expected Iterable or AsyncIterable as options.iterable`);
    }
    privates.iterable = options.iterable;

    privates.iterator = privates.iterable[privates.isAsync ? Symbol.asyncIterator : Symbol.iterator]();

    if (typeof options.next === 'function') {
      privates.next = options.next;
    } else {
      throw new TypeError(`Expected function as options.next`);
    }

    if (typeof options.complete === 'function') {
      privates.complete = options.complete;
    } else {
      throw new TypeError(`Expected function as options.complete`);
    }

    if (typeof options.error === 'function') {
      privates.error = options.error;
    } else {
      throw new TypeError(`Expected function as options.error`);
    }

    privates.state = 'pause';

    // async
    privates.pendingUntilRunning = [];

    // sync
    privates.resultState = 'awaiting';

    if (privates.isAsync) {
      PausableIterationIterate<TValue>(instance);
    }
  } else {
    throw new TypeError(`Expected object as PausableIteration.options`);
  }
}

export function IsPausableIteration<TValue = any>(value: any): value is IPausableIteration<TValue> {
  return IsObject(value)
    && value.hasOwnProperty(PAUSABLE_ITERATION_PRIVATE as symbol);
}


/** METHODS **/

/* GETTERS/SETTERS */

export function PausableIterationGetState<TValue>(instance: IPausableIteration<TValue>): TPausableIterableState {
  return (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE].state;
}

export function PausableIterationGetDone<TValue>(instance: IPausableIteration<TValue>): boolean {
  const state: TPausableIterableState = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE].state;
  return (state === 'complete')
    || (state === 'error');
}

/* METHODS */


export function PausableIterationRun<TValue>(instance: IPausableIteration<TValue>): void {
  if ((instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE].isAsync) {
    PausableIterationRunAsync<TValue>(instance);
  } else {
    PausableIterationRunSync<TValue>(instance);
  }
}

export function PausableIterationPause<TValue>(instance: IPausableIteration<TValue>): void {
  const privates: IPausableIterationPrivate<TValue> = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE];
  if (privates.state === 'run') {
    privates.state = 'pause';
  }
}



/** FUNCTIONS **/

/* ASYNC */

function PausableIterationRunAsync<TValue>(instance: IPausableIteration<TValue>): void {
  const privates: IPausableIterationPrivate<TValue> = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE];

  if (privates.state === 'pause') {
    privates.state = 'run';
    while (privates.pendingUntilRunning.length > 0) {
      (privates.pendingUntilRunning.shift() as () => void)();
    }
  }
}

function PausableIterationUntilRunning<TValue>(instance: IPausableIteration<TValue>): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE].pendingUntilRunning.push(resolve);
  });
}

async function PausableIterationIterate<TValue>(instance: IPausableIteration<TValue>): Promise<void> {
  const privates: IPausableIterationPrivate<TValue> = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE];

  while (true) {
    while (privates.state !== 'run') {
      await PausableIterationUntilRunning<TValue>(instance);
    }

    let result: IteratorResult<TValue>;

    try {
      result = await privates.iterator.next();
    } catch (_error) {
      while (privates.state !== 'run') {
        await PausableIterationUntilRunning<TValue>(instance);
      }
      privates.state = 'error';
      privates.error(_error);
      return;
    }

    if (result.done) {
      while (privates.state !== 'run') {
        await PausableIterationUntilRunning<TValue>(instance);
      }
      privates.state = 'complete';
      privates.complete();
      return;
    } else {
      while (privates.state !== 'run') {
        await PausableIterationUntilRunning<TValue>(instance);
      }
      privates.next((result as IteratorYieldResult<TValue>).value);
    }
  }
}


/* SYNC */

function PausableIterationRunSync<TValue>(instance: IPausableIteration<TValue>): void {
  const privates: IPausableIterationPrivate<TValue> = (instance as IPausableIterationInternal<TValue>)[PAUSABLE_ITERATION_PRIVATE];

  if (privates.state === 'pause') {
    privates.state = 'run';

    while (privates.state === 'run') {
      switch (privates.resultState) {
        case 'error':   // an error was awaiting to be resolved
          privates.state = 'error';
          privates.error(privates.result);
          return;
        case 'value':   // a value was awaiting to be resolved
          if (privates.result.done) {
            privates.complete();
            privates.state = 'complete';
            return;
          } else {
            privates.next((privates.result as IteratorYieldResult<TValue>).value);
            break;
          }
      }

      privates.resultState = 'awaiting';
      try {
        privates.result = privates.iterator.next();
        privates.resultState = 'value';
      } catch (_error) {
        privates.result = _error;
        privates.resultState = 'error';
      }
    }
  }
}


/** CLASS **/

export class PausableIteration<TValue> implements IPausableIteration<TValue> {

  constructor(options: IPausableIterationOptions<TValue>) {
    ConstructPausableIteration<TValue>(this, options);
  }

  get state(): TPausableIterableState {
    return PausableIterationGetState(this);
  }

  get done(): boolean {
    return PausableIterationGetDone(this);
  }

  run(): this {
    PausableIterationRun(this);
    return this;
  }

  pause(): this {
    PausableIterationPause(this);
    return this;
  }
}
