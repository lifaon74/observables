import { IExpression } from './interfaces';
import { DistinctValueObservable } from '../distinct-value-observable/sync/implementation';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import { TExpressionFactory } from './types';
import { EXPRESSION_PRIVATE, IExpressionInternal, IExpressionPrivate } from './privates';
import { ConstructExpression } from './constructor';
import { ExpressionUpdate } from './functions';
import { cancelIdleCallback } from '../../../misc/helpers/event-loop/request-idle-callback';


/** CONSTRUCTOR FUNCTIONS **/

export function ExpressionOnObserved<T>(instance: IExpression<T>): void {
  if ((instance as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer === null) {
    ExpressionUpdate<T>(instance);
  }
}

export function ExpressionOnUnobserved<T>(instance: IExpression<T>): void {
  if (!instance.observed) {
    const privates: IExpressionPrivate<T> = (instance as IExpressionInternal<T>)[EXPRESSION_PRIVATE];
    cancelIdleCallback(privates.requestIdleTimer);
    privates.requestIdleTimer = null;
  }
}

/** METHODS **/

/* GETTERS/SETTERS */

export function ExpressionGetFactory<T>(instance: IExpression<T>): TExpressionFactory<T> {
  return (instance as IExpressionInternal<T>)[EXPRESSION_PRIVATE].factory;
}

/** CLASS **/

export class Expression<T> extends DistinctValueObservable<T> implements IExpression<T> {
  constructor(factory: TExpressionFactory<T>) {
    let context: IObservableContext<T>;
    super((_context: IObservableContext<T>) => {
      context = _context;
      return {
        onObserved: (): void => {
          ExpressionOnObserved<T>(this);
        },
        onUnobserved: (): void => {
          ExpressionOnUnobserved<T>(this);
        },
      };
    });
    // @ts-ignore
    ConstructExpression<T>(this, context, factory);
  }

  get factory(): TExpressionFactory<T> {
    return ExpressionGetFactory<T>(this);
  }

}


