import { IObservableConstructor } from '../../core/observable/interfaces';
import { IValueObservable } from '../value-observable/interfaces';

export interface IExpressionConstructor extends IObservableConstructor {
  new<T>(factory: () => T): IExpression<T>;
}

/**
 * An Expression is similar to a Source, except its value comes from a factory function.
 * When the environment is idle (requestIdleTimer), it calls the factory, and emits the value returned with the same behaviour than a Source.
 *
 * @Example: - print navigator network state when it changes -
 *  new Expression(() => navigator.onLine)
 *  .pipeTo((onLine) => {
 *    console.log((onLine ? 'on' : 'off') + 'line');
 *  }).activate();
 */
export interface IExpression<T> extends IValueObservable<T> {
  readonly factory: () => T;
}