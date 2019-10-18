import { IEventLike } from './event-like/interfaces';

/**
 * ABSTRACT CLASS
 */


export interface IIEventsListenerConstructor {
  new(): IEventsListener;
}

export interface IEventsListener {
  addEventListener(type: string, listener: (event: IEventLike) => void): void;

  removeEventListener(type: string, listener: (event: IEventLike) => void): void;

  dispatchEvent?(event: IEventLike): void;
}


// /** FROM EVENT EMITTER **/
// export interface IEventEmitterEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
//   new(target: EventEmitter): IEventEmitterEventsListener;
// }
//
// export interface IEventEmitterEventsListener extends IEventsListener {
// }

// const a: EventTarget = null as any;
// function test(a: IEventsListener) {
// }
// test(a);
