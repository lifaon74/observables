import { IReason, IReasonOptions } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';


export const REASON_PRIVATE = Symbol('reason-private');

export interface IReasonPrivate<T> {
  message: string;
  code: T;
  stack: string;
}

export interface IReasonInternal<T> extends IReason<T> {
  [REASON_PRIVATE]: IReasonPrivate<T>;
}

export function ConstructReason<T>(
  instance: IReason<T>,
  options: string | IReasonOptions<T>,
  code?: T,
  stack?: string
): void {
  ConstructClassWithPrivateMembers(instance, REASON_PRIVATE);
  const privates: IReasonPrivate<T> = (instance as IReasonInternal<T>)[REASON_PRIVATE];
  let _options: IReasonOptions<T>;
  if ((options === void 0) || (typeof options === 'string')) {
    _options = {
      message: options,
      code: code,
      stack: stack,
    };
  } else if (IsObject(options) && (code === void 0) && (stack === void 0)) {
    _options = options;
  } else {
    throw new TypeError(`Expected Reason(object?) or Reason(string?, T?, string?)`);
  }

  if (typeof _options.message === 'string') {
    privates.message = _options.message;
  } else {
    throw new TypeError(`Expected string as Reason.options.message`);
  }

  privates.code = _options.code as T;

  if (_options.stack === void 0) {
    privates.stack = (new Error(privates.message).stack || '').replace('Error', 'Reason');
  } else if (typeof _options.stack === 'string') {
    privates.stack = _options.stack;
  } else {
    throw new TypeError(`Expected string or void as Reason.options.stack`);
  }
}

export function IsReason(value: any): value is IReason<any> {
  return IsObject(value)
    && value.hasOwnProperty(REASON_PRIVATE as symbol);
}

export class Reason<T = undefined> implements IReason<T> {

  constructor(message: string, code?: T, stack?: string);
  constructor(options: IReasonOptions<T>);
  constructor(options: string | IReasonOptions<T>, code?: T, stack?: string) {
    ConstructReason<T>(this, options, code, stack);
  }

  get message(): string {
    return ((this as unknown) as IReasonInternal<T>)[REASON_PRIVATE].message;
  }

  get code(): T {
    return ((this as unknown) as IReasonInternal<T>)[REASON_PRIVATE].code;
  }

  get stack(): string {
    return ((this as unknown) as IReasonInternal<T>)[REASON_PRIVATE].stack;
  }

  toJSON(): Pick<IReason<T>, 'message' | 'code' | 'stack'> {
    return {
      message: this.message,
      code: this.code,
      stack: this.stack,
    };
  }
}
