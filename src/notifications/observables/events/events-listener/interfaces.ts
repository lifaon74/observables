import { IEventLike } from './event-like/interfaces';

/**
 * INTERFACES
 */

/* ABSTRACT */

export interface IIEventsListenerConstructor {
  new(): IEventsListener;
}

/**
 * An EventsListener is an abstract view over an EventTarget or an EventEmitter
 */
export interface IEventsListener {
  addEventListener(type: string, listener: (event: IEventLike) => void): void;

  removeEventListener(type: string, listener: (event: IEventLike) => void): void;

  dispatchEvent?(event: IEventLike): void;
}


