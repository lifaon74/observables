import { TExpressionOrFunction } from '../types';
import { IExpression } from '../../../observables/distinct/expression/interfaces';
import { Expression } from '../../../observables/distinct/expression/implementation';
import { IsExpression } from '../../../observables/distinct/expression/constructor';

/**
 * Converts a callback or an Expression to an Expression
 */
export function $expression<T>(input: TExpressionOrFunction<T>): IExpression<T> {
  if (IsExpression(input)) {
    return input;
  } else if (typeof input === 'function') {
    return new Expression<T>(input);
  } else {
    throw new TypeError(`Expected Expression or function as input`);
  }
}
