import { IObservable, IObservableConstructor } from '../../core/observable/interfaces';

export interface IDOMChangeObservableConstructor extends IObservableConstructor {
  new(): IDOMChangeObservable;
}

export interface IDOMChangeObservable extends IObservable<void> {

}
