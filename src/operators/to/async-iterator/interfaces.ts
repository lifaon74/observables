import { IAsyncIterator } from '../../../misc/iterable/async-iterator/interfaces';
import { ICompleteStateObservable } from '../../../notifications/observables/complete-state/interfaces';


export interface IAsyncIteratorOfObservableConstructor {
  new<T>(observable: ICompleteStateObservable<T>): IAsyncIteratorOfObservable<T>;
}

export interface IAsyncIteratorOfObservable<T> extends IAsyncIterator<T, void> {

}


