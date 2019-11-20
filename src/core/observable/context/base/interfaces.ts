import { IObservable } from '../../interfaces';

/** INTERFACES **/

/**
 * Bare minimal structure of the ObservableContext
 */
export interface IObservableContextBase<T> {
  readonly observable: IObservable<T>;

  emit(...args: any[]): any;
}
