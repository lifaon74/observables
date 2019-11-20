import { IGenericEvent } from './interfaces';
import { EventLike } from '../implementation';
import { GENERIC_EVENT_PRIVATE, IGenericEventInternal } from './privates';
import { ConstructGenericEvent } from './constructor';


/**
 * METHODS
 */

/* GETTERS/SETTERS */

export function GenericEventGetValue<T>(instance: IGenericEvent<T>): T {
  return (instance as IGenericEventInternal<T>)[GENERIC_EVENT_PRIVATE].value;
}

/**
 * CLASS
 */

export class GenericEvent<T> extends EventLike implements IGenericEvent<T> {

  constructor(type: string, value: T) {
    super(type);
    ConstructGenericEvent(this, value);
  }

  get value(): T {
    return GenericEventGetValue<T>(this);
  }
}

