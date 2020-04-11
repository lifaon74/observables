import { TSyncOrAsyncIterable } from '../interfaces';

/** TYPES **/

export type TPausableIterableState = 'run' | 'pause' | 'complete' | 'error';


export interface IPausableIterationOptions<TValue> {
  iterable: TSyncOrAsyncIterable<TValue>;
  next: (value: TValue) => void;
  complete: () => void;
  error: (reason: any) => void;
}

/** INTERFACES **/

/**
 * Automatically iterates over an iterable, with a pause/resume workflow
 */

export interface IPausableIterationConstructor {
  new<TValue>(options: IPausableIterationOptions<TValue>): IPausableIteration<TValue>;
}

export interface IPausableIteration<TValue> {
  readonly state: TPausableIterableState;
  run(): this;
  pause(): this;
}
