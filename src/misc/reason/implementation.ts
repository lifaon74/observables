import { IReason } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';


export const REASON_PRIVATE = Symbol('reason-private');

export interface IReasonPrivate<T> {
  message: string;
  code: T;
}

export interface ReasonInternal<T> extends IReason<T> {
  [REASON_PRIVATE]: IReasonPrivate<T>;
}

export function ConstructReason<T>(
  instance: IReason<T>,
  message: string,
  code: T,
): void {
  ConstructClassWithPrivateMembers(instance, REASON_PRIVATE);
  const privates: IReasonPrivate<T> = (instance as ReasonInternal<T>)[REASON_PRIVATE];
  privates.message = message;
  privates.code = code;
}

export function IsReason(value: any): value is IReason<any> {
  return IsObject(value)
    && value.hasOwnProperty(REASON_PRIVATE as symbol);
}

export class Reason<T = void> implements IReason<T> {

  constructor(message: string, code: T) {
    ConstructReason<T>(this, message, code);
  }

  get message(): string {
    return ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].message;
  }

  get code(): T {
    return ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].code;
  }

  toJSON(): Pick<IReason<T>, 'message' | 'code'> {
    return {
      message: this.message,
      code: this.code,
    };
  }
}
