import { IObservable } from '../../core/observable/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';

export interface ILogicObservable extends IObservable<boolean> {
  readonly observables: IReadonlyList<IObservable<boolean>>;
}

export interface ILogicAndObservable extends ILogicObservable {
}

export interface ILogicOrObservable extends ILogicObservable {
}

export interface ILogicNotObservable extends IObservable<boolean> {
  readonly observable: IObservable<boolean>;
}