import { IObservable } from '../../../../../core/observable/interfaces';
import { $observable } from '../../../primitives/$observable';
import { $add } from '../../../arithmetic/$add';
import { $subtract } from '../../../arithmetic/$subtract';
import { $multiply } from '../../../arithmetic/$multiply';
import { $divide } from '../../../arithmetic/$divide';
import { $lowerThan } from '../../../comparision/$lowerThan';
import { $lowerThanOrEqual } from '../../../comparision/$lowerThanOrEqual';
import { $greaterThan } from '../../../comparision/$greaterThan';
import { $greaterThanOrEqual } from '../../../comparision/$greaterThanOrEqual';
import { $equal } from '../../../comparision/$equal';
import { $notEqual } from '../../../comparision/$notEqual';
import { $and } from '../../../logic/$and';
import { $or } from '../../../logic/$or';
import { $not } from '../../../logic/$not';

export type TIdentifierToValue = (identifier: string) => IObservable<any>;

export function ProgramToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  if (input.body.length === 1) {
    return ASTToObservable(input.body[0], variableMapper);
  } else {
    throw new Error(`Expected only une expression`);
  }
}

export function IdentifierObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return variableMapper(input.name as string);
}

export function LiteralObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return $observable(input.value);
}


export function ExpressionStatementToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return ASTToObservable(input.expression, variableMapper);
}


export function BinaryExpressionOperatorToObservableShortCut(operator: string): (...args: any[]) => IObservable<any> {
  switch (operator) {
    case '+':
      return $add;
    case '-':
      return $subtract;
    case '*':
      return $multiply;
    case '/':
      return $divide;
    case '<':
      return $lowerThan;
    case '<=':
      return $lowerThanOrEqual;
    case '>':
      return $greaterThan;
    case '>=':
      return $greaterThanOrEqual;
    case '===':
      return $equal;
    case '!==':
      return $notEqual;
    default:
      throw new TypeError(`Unknown operator: ${ operator }`);
  }
}

export function BinaryExpressionToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return BinaryExpressionOperatorToObservableShortCut(input.operator)(
    ASTToObservable(input.left, variableMapper),
    ASTToObservable(input.right, variableMapper),
  );
}


export function LogicalExpressionOperatorToObservableShortCut(operator: string): (...args: any[]) => IObservable<any> {
  switch (operator) {
    case '&&':
      return $and;
    case '||':
      return $or;
    default:
      throw new TypeError(`Unknown operator: ${ operator }`);
  }
}

export function LogicalExpressionToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return LogicalExpressionOperatorToObservableShortCut(input.operator)(
    ASTToObservable(input.left, variableMapper),
    ASTToObservable(input.right, variableMapper),
  );
}


export function UnaryExpressionOperatorToObservableShortCut(operator: string): (...args: any[]) => IObservable<any> {
  switch (operator) {
    case '!':
      return $not;
    default:
      throw new TypeError(`Unknown operator: ${ operator }`);
  }
}

export function UnaryExpressionToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  return UnaryExpressionOperatorToObservableShortCut(input.operator)(
    ASTToObservable(input.argument, variableMapper),
  );
}


export function ASTToObservable(input: any, variableMapper: TIdentifierToValue): IObservable<any> {
  switch (input.type) {
    case 'Program':
      return ProgramToObservable(input, variableMapper);
    case 'Identifier':
      return IdentifierObservable(input, variableMapper);
    case 'Literal':
      return LiteralObservable(input, variableMapper);
    case 'ExpressionStatement':
      return ExpressionStatementToObservable(input, variableMapper);
    case 'BinaryExpression':
      return BinaryExpressionToObservable(input, variableMapper);
    case 'LogicalExpression':
      return LogicalExpressionToObservable(input, variableMapper);
    case 'UnaryExpression':
      return UnaryExpressionToObservable(input, variableMapper);
    default:
      throw new TypeError(`Unknown ast type: ${ input.type }`);
  }
}

