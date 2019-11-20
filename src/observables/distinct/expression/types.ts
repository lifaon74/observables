import { IExpression } from './interfaces';


/** TYPES **/

export type TExpressionFactory<T> = (this: IExpression<T>) => T;
