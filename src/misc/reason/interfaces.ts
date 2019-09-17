export interface IReasonOptions<T> {
  message: string;
  code?: T;
  stack?: string;
}

export interface IReasonConstructor {
  new<T = undefined>(options: IReasonOptions<T>): IReason<T>;
  new<T = undefined>(message: string, code?: T, stack?: string): IReason<T>;
}

/**
 * A Reason is like an Error but more generic.
 * It has a message, and may have a typed code.
 */
export interface IReason<T = void> {
  readonly message: string;
  readonly code: T;
  readonly stack: string;

  toJSON(): Pick<IReason<T>, 'message' | 'code' | 'stack'>;
}
