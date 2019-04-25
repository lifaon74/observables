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

export function IsReason(value: any): value is IReason<any> {
  return IsObject(value)
    && value.hasOwnProperty(REASON_PRIVATE);
}

export class Reason<T = undefined> implements IReason<T>{

  constructor(message: string, code?: T) {
    ConstructClassWithPrivateMembers(this, REASON_PRIVATE);
    ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].message = message;
    ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].code = code;
  }

  get message(): string {
    return ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].message;
  }

  get code(): T {
    return ((this as unknown) as ReasonInternal<T>)[REASON_PRIVATE].code;
  }
}
