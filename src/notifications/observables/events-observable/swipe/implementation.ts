import { INotificationsObservableInternal, NotificationsObservable, NotificationsObservableDispatch } from '../../../core/notifications-observable/implementation';
import { ISwipeEvent, ISwipeEventInit, ISwipeObservable, ISwipeObservableKeyValueMap, TSwipeEventDirection } from './interfaces';
import { IObservableHook } from '../../../../core/observable/interfaces';
import { IObserver } from '../../../../core/observer/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';
import { ExtractObserverNameAndCallback, NotificationsObserver } from '../../../core/notifications-observer/implementation';
import { INotificationsObserver } from '../../../core/notifications-observer/interfaces';
import { EventsObservable } from '../implementation';
import { OBSERVABLE_PRIVATE } from '../../../../core/observable/implementation';
import { CyclicTypedVectorArray } from '../../../../classes/cyclic/CyclicTypedVectorArray';
import { INotification } from '../../../core/notification/interfaces';
import {
  KeyValueMapToNotificationsObserversLikeGeneric,
  TNotificationsObservableHook, TNotificationsObservableObserver
} from '../../../core/notifications-observable/interfaces';
import { KeyValueMapKeys, KeyValueMapValues } from '../../../core/interfaces';


// export abstract class Gesture {
//   public readonly name: string;
//   protected constructor(name: string) {
//     this.name = name;
//   }
// }
//
// export class Swipe extends Gesture {
//
//   static detect(positions: Float64Array): Swipe | null {
//     if (positions.length >= 6) {
//       const now: number = performance.now();
//       // for (let i = positions.length - 3; i >= 0; i -= 3)  {
//       // let angle: number = null;
//
//       console.log(now);
//       let i: number;
//       for (i = positions.length - 3; i >= 0; i -= 3)  {
//         if ((now - positions[i]) > 100) {
//           break;
//         }
//       }
//
//       if (i >= 0) { // move at least 100ms
//         console.warn(i);
//         console.log(positions);
//         positions = positions.subarray(i);
//         console.log(positions);
//         // TODO continue here
//
//       }
//     }
//
//     return null;
//   }
//
//   public readonly angle: number;
//   constructor(angle: number) {
//     super('swipe');
//     this.angle = angle;
//   }
// }


/*-----------------------*/

export const SWIPE_EVENT_PRIVATE = Symbol('event-private');

export interface ISwipeEventPrivate {
  angle: number;
  distance: number;
}

export interface ISwipeEventInternal extends ISwipeEvent {
  [SWIPE_EVENT_PRIVATE]: ISwipeEventPrivate;
}

export function ConstructSwipeEvent(event: ISwipeEvent, init: ISwipeEventInit): void {
  ConstructClassWithPrivateMembers(event, SWIPE_EVENT_PRIVATE);

  const angle: number = Number(init.angle);
  if (Number.isNaN(angle)) {
    throw new TypeError(`Expected number as init.angle`);
  } else {
    (event as ISwipeEventInternal)[SWIPE_EVENT_PRIVATE].angle = NormalizeAngle(angle);
  }

  const distance: number = Number(init.distance);
  if (Number.isNaN(distance)) {
    throw new TypeError(`Expected number as init.distance`);
  } else if (distance < 0) {
    throw new TypeError(`Expected number greater than 0 as init.distance`);
  } else {
    (event as ISwipeEventInternal)[SWIPE_EVENT_PRIVATE].distance = distance;
  }
}

function PositiveModulo(value: number, modulo: number): number {
  value = value % modulo;
  return (value < 0) ? (value + modulo) : value;
}

function NormalizeAngle(angle: number): number { // [-pi, pi[
  angle = PositiveModulo(angle, Math.PI * 2);
  return (angle >= Math.PI) ? (angle - (Math.PI * 2)) : angle;
}

// const PI_3_4: number = 0.75 * Math.PI;
// const PI_1_4: number = 0.25 * Math.PI;
const PI_1_8: number = (1 / 8) * Math.PI;
const PI_3_8: number = (3 / 8) * Math.PI;
const PI_5_8: number = (5 / 8) * Math.PI;
const PI_7_8: number = (7 / 8) * Math.PI;

export class SwipeEvent extends Event implements ISwipeEvent {
  constructor(type: string, init: ISwipeEventInit) {
    super(type, init);
    ConstructSwipeEvent(this, init);
  }

  get angle(): number {
    return ((this as unknown) as ISwipeEventInternal)[SWIPE_EVENT_PRIVATE].angle;
  }

  get distance(): number {
    return ((this as unknown) as ISwipeEventInternal)[SWIPE_EVENT_PRIVATE].distance;
  }

  get direction(): TSwipeEventDirection {
    const angle: number = ((this as unknown) as ISwipeEventInternal)[SWIPE_EVENT_PRIVATE].angle;
    if (angle <= -PI_7_8) {
      return 'left';
    } else if (angle <= -PI_5_8) {
      return 'bottom-left';
    } else if (angle <= -PI_3_8) {
      return 'bottom';
    } else if (angle <= -PI_1_8) {
      return 'bottom-right';
    } else if (angle <= PI_1_8) {
      return 'right';
    } else if (angle <= PI_3_8) {
      return 'top-right';
    } else if (angle <= PI_5_8) {
      return 'top';
    } else if (angle <= PI_7_8) {
      return 'top-left';
    } else {
      return 'left';
    }

    // if (angle <= -PI_3_4) {
    //   return 'left';
    // } else if (angle <= -PI_1_4) {
    //   return 'bottom';
    // } else if (angle <= PI_1_4) {
    //   return 'right';
    // } else if (angle <= PI_3_4) {
    //   return 'top';
    // } else {
    //   return 'left';
    // }
  }
}



/*-----------------------*/

export const SWIPE_OBSERVABLE_PRIVATE = Symbol('swipe-observable-private');

export interface ISwipeObservablePrivate<TTarget extends EventTarget> {
  target: TTarget;
  touchStartObserver: INotificationsObserver<'touchstart', TouchEvent>;
  touchMoveObserver: INotificationsObserver<'touchmove', TouchEvent>;
  touchEndObserver: INotificationsObserver<'touchend', TouchEvent>;
  coords: CyclicTypedVectorArray<Float64Array>;
}

export interface ISwipeObservableInternal<TTarget extends EventTarget> extends ISwipeObservable<TTarget>, INotificationsObservableInternal<ISwipeObservableKeyValueMap> {
  [SWIPE_OBSERVABLE_PRIVATE]: ISwipeObservablePrivate<TTarget>;
}

const SWIPE_OBSERVABLE_COORDS_LENGTH: number = 300;

export function ConstructSwipeObservable<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>, target: TTarget): void {
  ConstructClassWithPrivateMembers(observable, SWIPE_OBSERVABLE_PRIVATE);
  const privates: ISwipeObservablePrivate<TTarget> = (observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE];

  privates.target = target;
  privates.coords = new CyclicTypedVectorArray<Float64Array>(new Float64Array(SWIPE_OBSERVABLE_COORDS_LENGTH), 3);

  const targetEventsObservable = new EventsObservable<GlobalEventHandlersEventMap>(target);
  const windowEventsObservable = new EventsObservable<WindowEventMap>(window);

  privates.touchStartObserver = targetEventsObservable
    .addListener('touchstart', (event: TouchEvent) => {
      SwipeObservableOnTouchStart<TTarget>(observable, event);
    });

  privates.touchMoveObserver = windowEventsObservable
    .addListener('touchmove', (event: TouchEvent) => {
      SwipeObservableOnTouchMove<TTarget>(observable, event);
    });

  privates.touchEndObserver = windowEventsObservable
    .addListener('touchend', (event: TouchEvent) => {
      SwipeObservableOnTouchEnd<TTarget>(observable, event);
    });
}


const tempVec3Float64Array = new Float64Array(3);
const tempCoords: Float64Array = new Float64Array(SWIPE_OBSERVABLE_COORDS_LENGTH);

function WriteTouchCoordsFromTouch(coords: CyclicTypedVectorArray<Float64Array>, touch: Touch): void {
  tempVec3Float64Array[0] = performance.now();
  tempVec3Float64Array[1] = touch.clientX;
  tempVec3Float64Array[2] = touch.clientY;
  coords.write(tempVec3Float64Array, true);
}

export function SwipeObservableOnTouchStart<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>, event: TouchEvent): void {
  const privates: ISwipeObservablePrivate<TTarget> = (observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE];

  if (event.touches.length === 1) {
    privates.coords.reset();
    WriteTouchCoordsFromTouch(privates.coords, event.touches[0]);
    privates.touchMoveObserver.activate();
    privates.touchEndObserver.activate();
  } else {
    privates.touchMoveObserver.deactivate();
    privates.touchEndObserver.deactivate();
  }
}

export function SwipeObservableOnTouchMove<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>, event: TouchEvent): void {
  WriteTouchCoordsFromTouch((observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE].coords, event.touches[0]);
}

/**
 * Some math:
 * - https://www.zebulon.fr/questions-reponses/distance-d-un-point-a-une-droite-266.html
 * line equation (AB): a * x + b * x + c = 0
 *  with: a = By - Ay; b = Ax - Bx; c = (Ay - By) * Ax + (Bx - Ax) * Ay = -a * Ax - b * Ay
 *
 * distance(line, C): abs(Cx * a + Cy * b + c) / sqrt(a^2 + b^2)
 *  = abs(a * (Cx - Ax) + b * (Cy - Ay)) / sqrt(...)
 * @param observable
 * @param event
 * @constructor
 */
export function SwipeObservableOnTouchEnd<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>, event: TouchEvent): void {
  if (event.touches.length === 1) {
    SwipeObservableOnTouchStart<TTarget>(observable, event);
  } else {
    const privates: ISwipeObservablePrivate<TTarget> = (observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE];

    privates.touchMoveObserver.deactivate();
    privates.touchEndObserver.deactivate();

    if (privates.coords.readable() >= 6) {
      let positions: Float64Array = privates.coords.toTypedArray(tempCoords);
      const now: number = performance.now();
      if ((now - positions[0]) < 250) { // movement took a maximum of 250ms
        const lastIndex: number = positions.length - 3;
        positions[lastIndex] = now;
        const a: number = positions[lastIndex + 2] - positions[2]; // dy
        const b: number = positions[1] - positions[lastIndex + 1]; // -dx
        const d_ab: number = Math.sqrt(a * a + b * b);

        if (d_ab > 150) { // we travel at least 150px
          let noise: number = 0;

          // console.log(a, b, d_ab);

          for (let i = 3; i < lastIndex; i += 3)  {
            const d: number = Math.abs(a * (positions[i + 1] - positions[1]) + b * (positions[i + 2] - positions[2])) / d_ab;
            noise += d * d;
          }

          noise /= (positions.length / 3) - 2;

          if (noise < 100) {
            NotificationsObservableDispatch<ISwipeObservableKeyValueMap, 'swipe'>(observable, 'swipe', new SwipeEvent('swipe', {
              angle: Math.atan2(-a, -b),
              distance: d_ab
            }));
          }
        }

      }
    }
  }
}

export function HandleSwipeObservableOnObserved<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>, observer: TNotificationsObservableObserver<ISwipeObservableKeyValueMap>): void {
  const nameAndCallback: KeyValueMapToNotificationsObserversLikeGeneric<ISwipeObservableKeyValueMap> | null = ExtractObserverNameAndCallback<KeyValueMapKeys<ISwipeObservableKeyValueMap>, KeyValueMapValues<ISwipeObservableKeyValueMap>>(observer);
  if ((observer instanceof NotificationsObserver) && (nameAndCallback.name !== 'swipe')){
    throw new TypeError(`Cannot observe an SwipeObservable, with a NotificationsObserver having name '${nameAndCallback.name}'. Expected 'swipe'.`);
  }

  if ((observable as ISwipeObservableInternal<TTarget>)[OBSERVABLE_PRIVATE].observers.length === 1) {
    (observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE].touchStartObserver.activate();
  }
}

export function HandleSwipeObservableOnUnobserved<TTarget extends EventTarget>(observable: ISwipeObservable<TTarget>,): void {
  if ((observable as ISwipeObservableInternal<TTarget>)[OBSERVABLE_PRIVATE].observers.length === 0) {
    (observable as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE].touchStartObserver.deactivate();
  }
}

export class SwipeObservable<TTarget extends EventTarget = EventTarget> extends NotificationsObservable<ISwipeObservableKeyValueMap> implements ISwipeObservable<TTarget> {
  constructor(target: TTarget) {
    super((): TNotificationsObservableHook<ISwipeObservableKeyValueMap> => {
      return {
        onObserved: (observer: TNotificationsObservableObserver<ISwipeObservableKeyValueMap>) => {
          HandleSwipeObservableOnObserved<TTarget>(this, observer);
        },
        onUnobserved: () => {
          HandleSwipeObservableOnUnobserved<TTarget>(this);
        }
      }
    });
    ConstructSwipeObservable<TTarget>(this, target);
  }

  get target(): TTarget {
    return ((this as unknown) as ISwipeObservableInternal<TTarget>)[SWIPE_OBSERVABLE_PRIVATE].target;
  }
}



export function testSwipeObservable(): void {
  const observable = new SwipeObservable(window);
  observable.addListener('swipe', (event: ISwipeEvent) => {
    console.log('swipe', event.direction, event.angle);
  }).activate();
}

