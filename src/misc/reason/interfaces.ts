export interface IReasonConstructor {
  new<T = undefined>(message: string, code?: T): IReason<T>;
}

/**
 * A Reason is like an Error but more generic.
 * It has a message, and may have a typed code.
 */
export interface IReason<T = undefined> {
  readonly message: string;
  readonly code: T;

  toJSON(): Pick<IReason<T>, 'message' | 'code'>;
}
