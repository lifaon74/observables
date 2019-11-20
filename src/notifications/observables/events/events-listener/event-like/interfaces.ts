/**
 * INTERFACES
 */

/* ABSTRACT */
export interface IEventLikeConstructor {
  new(type: string): IEventLike;
}

export interface IEventLike {
  readonly type: string;
}

