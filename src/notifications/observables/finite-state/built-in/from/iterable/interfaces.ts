import { IFiniteStateObservable, IFiniteStateObservableConstructor } from '../../../interfaces';
import {
  IFromIterableObservableKeyValueMap, IFromIterableObservableOptions, TFromIterableObservableFinalState,
  TFromIterableObservableMode, TGetSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from './types';


/** INTERFACES **/

export interface IFromIterableObservableStatic extends Omit<IFiniteStateObservableConstructor, 'new'> {

}

export interface IFromIterableObservableConstructor extends IFromIterableObservableStatic {
  new<TIterable extends TSyncOrAsyncIterable<any>>(iterable: TIterable, options?: IFromIterableObservableOptions): IFromIterableObservable<TIterable>;
}

export interface IFromIterableObservableTypedConstructor<TIterable extends TSyncOrAsyncIterable<any>> extends IFromIterableObservableStatic {
  new<TIterable extends TSyncOrAsyncIterable<any>>(iterable: TIterable, options?: IFromIterableObservableOptions): IFromIterableObservable<TIterable>;
}


export interface IFromIterableObservable<TIterable extends TSyncOrAsyncIterable<any>> extends IFiniteStateObservable<TGetSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TIterable>> {
}
