import { IAsyncIterator } from '../../../misc/iterable/async-iterator/interfaces';
import { IObservable } from '../../../core/observable/interfaces';


export interface IAsyncIteratorOfObservableConstructor {
  new<T>(observable: IObservable<T>): IAsyncIteratorOfObservable<T>;
}

export interface IAsyncIteratorOfObservable<T> extends IAsyncIterator<T, void> {

}


