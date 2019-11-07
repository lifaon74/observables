import { IEventLike } from './interfaces';
import { EVENT_LIKE_PRIVATE, IEventLikeInternal } from './privates';
import { ConstructEventLike } from './constructor';


/** METHODS **/

/* GETTERS/SETTERS */

export function EventLikeGetType(instance: IEventLike): string {
  return (instance as IEventLikeInternal)[EVENT_LIKE_PRIVATE].type;
}

/**
 * ABSTRACT CLASS
 */

export abstract class EventLike implements IEventLike {

  protected constructor(type: string) {
    ConstructEventLike(this, type);
  }

  get type(): string {
    return EventLikeGetType(this);
  }
}

