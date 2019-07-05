import { IObservable } from '../../core/observable/interfaces';


export interface ITimerObservableConstructor {
  new(period: number): ITimerObservable;
}

/**
 * A TimerObservable, emits "undefined" (no value) every period (ms)
 *
 * @Example: - log current date every 1000ms -
 *  new TimerObservable(1000).pipeTo(() => {
 *    console.log(new Date());
 *  }).activate();
 */
export interface ITimerObservable extends IObservable<void> {
  readonly period: number;
}
