import { IExpression } from './interfaces';
import { IDistinctValueObservablePrivatesInternal } from '../distinct-value-observable/sync/privates';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import { TExpressionFactory } from './types';

/** PRIVATES **/

export const EXPRESSION_PRIVATE = Symbol('expression-private');

export interface IExpressionPrivate<T> {
  context: IObservableContext<T>;
  factory: TExpressionFactory<T>;
  requestIdleTimer: any;
}

export interface IExpressionPrivatesInternal<T> extends IDistinctValueObservablePrivatesInternal<T> {
  [EXPRESSION_PRIVATE]: IExpressionPrivate<T>;
}

export interface IExpressionInternal<T> extends IExpressionPrivatesInternal<T>, IExpression<T> {
}
