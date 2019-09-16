import { ICancelToken } from '../../../../../misc/cancel-token/interfaces';
import {
  IPromiseObservable, IPromiseObservableKeyValueMap, IPromiseObservableOptions, TPromiseObservableFactory,
  TPromiseObservableFinalState, TPromiseObservableMode
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../../../helpers';
import { FiniteStateObservable, GetFiniteStateObservableDefaultModes } from '../../implementation';
import {
  GenerateFiniteStateObservableHookFromPromise, GenerateFiniteStateObservableHookFromPromiseForEachObservers
} from './hook-generators';
import { TFiniteStateObservableCreateCallback } from '../../interfaces';


export const PROMISE_OBSERVABLE_PRIVATE = Symbol('promise-observable-private');

export interface IPromiseObservablePrivate<T> {
}

export interface IPromiseObservableInternal<T> extends IPromiseObservable<T> {
  [PROMISE_OBSERVABLE_PRIVATE]: IPromiseObservablePrivate<T>;
}


export function ConstructPromiseObservable<T>(
  instance: IPromiseObservable<T>,
): void {
  ConstructClassWithPrivateMembers(instance, PROMISE_OBSERVABLE_PRIVATE);
}

export function IsPromiseObservable(value: any): value is IPromiseObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(PROMISE_OBSERVABLE_PRIVATE as symbol);
}

/**
 * INIT
 */

export interface IPromiseObservableOptionsStrict extends IPromiseObservableOptions {
  modes: Set<TPromiseObservableMode>;
}


export function NormalizePromiseObservableOptions(options: IPromiseObservableOptions = {}): IPromiseObservableOptionsStrict {
  if (IsObject(options)) {
    const modes: Set<TPromiseObservableMode> = GetFiniteStateObservableDefaultModes();
    modes.add('every');
    return Object.assign({}, options, {
      modes: modes,
    });
  } else {
    throw new TypeError(`Expected object or void as PromiseObservable.options`);
  }
}

export function PromiseObservableGetObservableHookCallback<T>(promiseFactory: TPromiseObservableFactory<T>, options: IPromiseObservableOptionsStrict): TFiniteStateObservableCreateCallback<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
  return (
    (options.mode === 'every')
      ? GenerateFiniteStateObservableHookFromPromiseForEachObservers<T>(promiseFactory)
      : GenerateFiniteStateObservableHookFromPromise<T>(promiseFactory)
  ) as TFiniteStateObservableCreateCallback<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>>;
}

/**
 * STATIC
 */

export function PromiseObservableFromPromise<T>(promise: Promise<T>, token?: ICancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
  return new PromiseObservable<T>((_token: ICancelToken) => {
    if (token !== void 0) {
      _token.linkWithToken(token);
    }
    return promise;
  }, options);
}

/**
 * CLASS
 */

export class PromiseObservable<T> extends FiniteStateObservable<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> implements IPromiseObservable<T> {

  static fromPromise<T>(promise: Promise<T>, token?: ICancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
    return PromiseObservableFromPromise<T>(promise, token, options);
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


/*
function doRequestWithTimeout(timeout: number = 60000, token?: CancelToken) {
  const _token = new CancelToken();

  setTimeout(() => {
    _token.cancel(new Reason(`Timeout reached`, 'TIMEOUT'));
  }, timeout);

  if (token !== void 0) {
    _token.linkWithToken(token);
  }

  return _token.wrapPromise(fetch(..._token.wrapFetchArguments('http://domain.com/request1')));
}
*/
