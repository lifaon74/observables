import { ITimerObservable } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { Observable } from '../../core/observable/implementation';
import { IObservableContext } from '../../core/observable/interfaces';


export const TIMER_OBSERVABLE_PRIVATE = Symbol('timer-observable-private');

export interface ITimerObservablePrivate {
  context: IObservableContext<void>;
  period: number;
  timer: any | null;
}

export interface ITimerObservableInternal extends ITimerObservable {
  [TIMER_OBSERVABLE_PRIVATE]: ITimerObservablePrivate;
}


export function ConstructTimerObservable(observable: ITimerObservable, context: IObservableContext<void>, period: number): void {
  ConstructClassWithPrivateMembers(observable, TIMER_OBSERVABLE_PRIVATE);
  (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].context = context;
  (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].period = period;
  (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].timer = null;
}

export function TimerObservableOnObserved(observable: ITimerObservable): void {
  if ((observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].timer === null) {
    (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].timer = setInterval(() => {
      (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].context.emit(void 0);
    }, (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].period);
  }
}

export function TimerObservableOnUnobserved(observable: ITimerObservable): void {
  if (!observable.observed) {
    clearInterval((observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].timer);
    (observable as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].timer = null;
  }
}


export class TimerObservable extends Observable<void> implements ITimerObservable {
  constructor(period: number) {
    let context: IObservableContext<void> = void 0;
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
    ConstructTimerObservable(this, context, period);
  }

  get period(): number {
    return ((this as unknown) as ITimerObservableInternal)[TIMER_OBSERVABLE_PRIVATE].period;
  }
}

