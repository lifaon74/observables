import { IFiniteStateObservable } from '../../../interfaces';
import {
  IFromReadableStreamObservableKeyValueMap, IFromReadableStreamObservableOptions,
  TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode
} from './types';


/** INTERFACES **/

export interface IFromReadableStreamObservableConstructor {
  new<T>(reader: ReadableStreamReader<T>, options?: IFromReadableStreamObservableOptions): IFromReadableStreamObservable<T>;
}

export interface IFromReadableStreamObservable<T> extends IFiniteStateObservable<T, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<T>> {
}
