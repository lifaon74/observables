import { IObservableConstructor } from '../../../core/observable/interfaces';
import { IDistinctValueObservable } from '../distinct-value-observable/sync/interfaces';
import { TExpressionFactory } from './types';

/** INTERFACES **/

export interface IExpressionStatic extends Omit<IObservableConstructor, 'new'> {

}

export interface IExpressionConstructor extends IExpressionStatic {
  new<T>(factory: TExpressionFactory<T>): IExpression<T>;
}

export interface IExpressionTypedConstructor<T> extends IExpressionStatic {
  new(factory: TExpressionFactory<T>): IExpression<T>;
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
export interface IExpression<T> extends IDistinctValueObservable<T> {
  readonly factory: TExpressionFactory<T>;
}
