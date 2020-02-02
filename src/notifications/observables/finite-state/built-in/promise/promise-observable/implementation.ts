import { IPromiseObservable } from './interfaces';
import { FiniteStateObservable } from '../../../implementation';
import {
  GenerateFiniteStateObservableHookFromPromise, GenerateFiniteStateObservableHookFromPromiseForEachObservers
} from './hook-generators';
import { TFiniteStateObservableCreateCallback } from '../../../types';
import {
  IPromiseObservableFromPromiseOptions, IPromiseObservableKeyValueMap, IPromiseObservableOptions,
  TPromiseObservableFactory, TPromiseObservableFinalState, TPromiseObservableMode
} from './types';
import { ConstructPromiseObservable } from './constructor';
import { IPromiseObservableOptionsStrict, NormalizePromiseObservableOptions } from './functions';


/** CONSTRUCTOR FUNCTIONS **/

export function PromiseObservableGetObservableHookCallback<T>(promiseFactory: TPromiseObservableFactory<T>, options: IPromiseObservableOptionsStrict): TFiniteStateObservableCreateCallback<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
  return (
    (options.mode === 'every')
      ? GenerateFiniteStateObservableHookFromPromiseForEachObservers<T>(promiseFactory)
      : GenerateFiniteStateObservableHookFromPromise<T>(promiseFactory)
  ) as TFiniteStateObservableCreateCallback<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>>;
}

/** METHODS **/

/* STATIC */
export function PromiseObservableStaticFromPromise<T>(promise: Promise<T>, options: IPromiseObservableFromPromiseOptions = {}): IPromiseObservable<T> {
  return new PromiseObservable<T>(() => {
    return promise;
  }, options);
}

/** CLASS **/

export class PromiseObservable<T> extends FiniteStateObservable<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> implements IPromiseObservable<T> {

  static fromPromise<T>(promise: Promise<T>, options?: IPromiseObservableFromPromiseOptions): IPromiseObservable<T> {
    return PromiseObservableStaticFromPromise<T>(promise, options);
  }

  constructor(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions) {
    const _options: IPromiseObservableOptionsStrict = NormalizePromiseObservableOptions(options);
    super(
      PromiseObservableGetObservableHookCallback<T>(promiseFactory, _options),
      _options
    );
    ConstructPromiseObservable<T>(this);
  }
}


