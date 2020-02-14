import { ResizeObserverObserveOptions } from './ResizeObserver'; // TODO fix in the future when definition will exists
import { IObservable, IObservableConstructor } from '../../core/observable/interfaces';

export interface IDOMResizeObservableOptions extends ResizeObserverObserveOptions {
  maxRefreshPeriod?: number;
}

export interface IDOMResizeObservableConstructor extends IObservableConstructor {
  new(element: Element, options?: IDOMResizeObservableOptions): IDOMResizeObservable;
}

export interface IDOMResizeObservable extends IObservable<void> {

}
