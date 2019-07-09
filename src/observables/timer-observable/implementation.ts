import { ITimerObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { Observable } from '../../core/observable/implementation';
import { IObservableContext } from '../../core/observable/interfaces';
import { IsObject } from '../../helpers';


export const TIMER_OBSERVABLE_PRIVATE = Symbol('timer-observable-private');

export interface ITimerObservablePrivate {
  context: IObservableContext<undefined>;
  period: number;
  timer: any | null;
}

export interface ITimerObservableInternal extends ITimerObservable {
  [TIMER_OBSERVABLE_PRIVATE]: ITimerObservablePrivate;
}


export function ConstructTimerObservable(instance: ITimerObservable, context: IObservableContext<undefined>, period: number): void {
  ConstructClassWithPrivateMembers(instance, TIMER_OBSERVABLE_PRIVATE);
  const privates: ITimerObservablePrivate = (instance as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE];
  privates.context = context;
  privates.period = period;
  privates.timer = null;
}

export function IsTimerObservable(value: any): value is ITimerObservable {
  return IsObject(value)
    && value.hasOwnProperty(TIMER_OBSERVABLE_PRIVATE as symbol);
}

export function TimerObservableOnObserved(instance: ITimerObservable): void {
  const privates: ITimerObservablePrivate = (instance as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE];
  if (privates.timer === null) {
    privates.timer = setInterval(() => {
      privates.context.emit(void 0);
    }, privates.period);
  }
}

export function TimerObservableOnUnobserved(instance: ITimerObservable): void {
  if (!instance.observed) {
    const privates: ITimerObservablePrivate = (instance as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE];
    clearInterval(privates.timer);
    privates.timer = null;
  }
}


export class TimerObservable extends Observable<void> implements ITimerObservable {
  constructor(period: number) {
    let context: IObservableContext<void>;
    super((_context: IObservableContext<void>) => {
      context = _context;
      return {
        onObserved: (): void => {
          TimerObservableOnObserved(this);
        },
        onUnobserved: (): void => {
          TimerObservableOnUnobserved(this);
        }
      };
    });
    // @ts-ignore
    ConstructTimerObservable(this, context, period);
  }

  get period(): number {
    return ((this as unknown) as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].period;
  }
}

