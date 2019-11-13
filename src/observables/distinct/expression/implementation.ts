import { IExpression } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IDistinctValueObservableInternal, DistinctValueObservable } from '../distinct-value-observable/implementation';
import { IsObject } from '../../../helpers';
import { IObservableContext } from '../../../core/observable/context/interfaces';


export const EXPRESSION_PRIVATE = Symbol('expression-private');

export interface IExpressionPrivate<T> {
  context: IObservableContext<T>;

  factory(): T;

  requestIdleTimer: any;
}

export interface IExpressionInternal<T> extends IExpression<T>, IDistinctValueObservableInternal<T> {
  [EXPRESSION_PRIVATE]: IExpressionPrivate<T>;
}


export function ConstructExpression<T>(expression: IExpression<T>, context: IObservableContext<T>, factory: () => T): void {
  ConstructClassWithPrivateMembers(expression, EXPRESSION_PRIVATE);

  (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].context = context;
  (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].factory = factory;
  (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer = null;
}


export function IsExpression(value: any): value is IExpression<any> {
  return IsObject(value)
    && value.hasOwnProperty(EXPRESSION_PRIVATE);
}


export function ExpressionOnObserved<T>(expression: IExpression<T>): void {
  if ((expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer === null) {
    ExpressionUpdate<T>(expression);
  }
}

export function ExpressionOnUnobserved<T>(expression: IExpression<T>): void {
  if (!expression.observed) {
    (window as any).cancelIdleCallback((expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer);
    (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer = null;
  }
}


export function ExpressionUpdate<T>(expression: IExpression<T>): void {
  (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].context.emit((expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].factory());
  (expression as IExpressionInternal<T>)[EXPRESSION_PRIVATE].requestIdleTimer = (window as any).requestIdleCallback(() => {
    ExpressionUpdate<T>(expression);
  });
}


export class Expression<T> extends DistinctValueObservable<T> implements IExpression<T> {
  constructor(factory: () => T) {
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

  get factory(): () => T {
    return ((this as unknown) as IExpressionInternal<T>)[EXPRESSION_PRIVATE].factory;
  }

}


