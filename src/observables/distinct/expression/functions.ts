import { IExpression } from './interfaces';
import { EXPRESSION_PRIVATE, IExpressionInternal, IExpressionPrivate } from './privates';

/** FUNCTIONS **/

export function ExpressionUpdate<T>(instance: IExpression<T>): void {
  const privates: IExpressionPrivate<T> = (instance as IExpressionInternal<T>)[EXPRESSION_PRIVATE];
  privates.context.emit(privates.factory.call(instance));
  privates.requestIdleTimer = (window as any).requestIdleCallback(() => {
    ExpressionUpdate<T>(instance);
  });
}
