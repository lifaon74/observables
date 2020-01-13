import { IObservable, IObservableConstructor } from '../../core/observable/interfaces';

export interface IDOMChangeObservableOptions extends MutationObserverInit {
  maxRefreshPeriod?: number;
}

export interface IDOMChangeObservableConstructor extends IObservableConstructor {
  new(node?: Node, options?: IDOMChangeObservableOptions): IDOMChangeObservable;
}

export interface IDOMChangeObservable extends IObservable<void> {

}
