import { INotificationsObservable } from '../../../core/notifications-observable/interfaces';

// export type TSwipeEventDirection = 'top-bottom' | 'bottom-top' | 'left-right' | 'right-left';
export type TSwipeEventDirection = 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export interface ISwipeEventInit extends EventInit {
  angle: number;
  distance: number;
}

export interface ISwipeEvent extends Event {
  readonly angle: number;
  readonly distance: number;
  readonly direction: TSwipeEventDirection;
}

export interface ISwipeObservableKeyValueMap {
  swipe: ISwipeEvent;
}

export interface ISwipeObservable<TTarget extends EventTarget = EventTarget> extends INotificationsObservable<ISwipeObservableKeyValueMap> {
  readonly target: TTarget;
}
