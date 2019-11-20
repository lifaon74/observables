import { IExpression } from './interfaces';
import { IObservableContext } from '../../../core/observable/context/interfaces';
import { TExpressionFactory } from './types';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { EXPRESSION_PRIVATE, IExpressionInternal, IExpressionPrivate } from './privates';
import { IsObject } from '../../../helpers';

/** CONSTRUCTOR **/

export function ConstructExpression<T>(
  instance: IExpression<T>,
  context: IObservableContext<T>,
  factory: TExpressionFactory<T>
): void {
  ConstructClassWithPrivateMembers(instance, EXPRESSION_PRIVATE);
  const privates: IExpressionPrivate<T> = (instance as IExpressionInternal<T>)[EXPRESSION_PRIVATE];

  privates.context = context;
  privates.factory = factory;
  privates.requestIdleTimer = null;
}

export function IsExpression(value: any): value is IExpression<any> {
  return IsObject(value)
    && value.hasOwnProperty(EXPRESSION_PRIVATE as symbol);
}
