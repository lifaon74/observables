import { IObservableContext } from '../../../core/observable/interfaces';
import { IExpression } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IValueObservableInternal, ValueObservable } from '../value-observable/implementation';
import { IsObject } from '../../../helpers';


export const EXPRESSION_PRIVATE = Symbol('expression-private');

export interface IExpressionPrivate<T> {
  context: IObservableContext<T>;

  factory(): T;

  requestIdleTimer: any;
}

export interface IExpressionInternal<T> extends IExpression<T>, IValueObservableInternal<T> {
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


export class Expression<T> extends ValueObservable<T> implements IExpression<T> {
  constructor(factory: () => T) {
    let context: IObservableContext<T> = void 0;
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
    ConstructExpression<T>(this, context, factory);
  }

  get factory(): () => T {
    return ((this as unknown) as IExpressionInternal<T>)[EXPRESSION_PRIVATE].factory;
  }

}


