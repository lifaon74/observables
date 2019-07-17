import { Notification } from '../../../../core/notification/implementation';
import { IPromiseCancelToken } from '../promise-cancel-token/interfaces';
import {
  IPromiseObservable, IPromiseObservableKeyValueMap, IPromiseObservableOptions, IPromiseObservableResetOptions,
  TPromiseObservableFactory, TPromiseObservableMode, TPromiseObservableNotifications
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../../misc/helpers/ClassWithPrivateMembers';
import { PromiseCancelToken } from '../promise-cancel-token/implementation';
import { Reason } from '../../../../../misc/reason/implementation';
import { IsObject, UntilDefined } from '../../../../../helpers';
import { CompleteStateObservable, NormalizeCompleteStateObserversMode } from '../../implementation';
import {
  BuildCompleteStateObservableHookBasedOnPerObserverFactoryFunction,
  BuildCompleteStateObservableHookBasedOnSharedFactoryFunction
} from '../../factory';
import { setImmediate } from '../../../../../classes/set-immediate';


export const PROMISE_OBSERVABLE_PRIVATE = Symbol('promise-observable-private');

export interface IPromiseObservablePrivate<T> {
  promiseFactory: TPromiseObservableFactory<T>;
  reset: IPromiseObservableResetOptions;
}

export interface IPromiseObservableInternal<T> extends IPromiseObservable<T> {
  [PROMISE_OBSERVABLE_PRIVATE]: IPromiseObservablePrivate<T>;
}


export function ConstructPromiseObservable<T>(
  instance: IPromiseObservable<T>,
  promiseFactory: TPromiseObservableFactory<T>,
  options: IPromiseObservableOptionsStrict
): void {
  ConstructClassWithPrivateMembers(instance, PROMISE_OBSERVABLE_PRIVATE);
  const privates: IPromiseObservablePrivate<T> = (instance as IPromiseObservableInternal<T>)[PROMISE_OBSERVABLE_PRIVATE];

  if (typeof promiseFactory === 'function') {
    privates.promiseFactory = promiseFactory;
  } else {
    throw new TypeError(`Expected function as promiseFactory when creating a PromiseObservable.`);
  }

  privates.reset = options.reset;
}

export function IsPromiseObservable(value: any): value is IPromiseObservable<any> {
  return IsObject(value)
    && value.hasOwnProperty(PROMISE_OBSERVABLE_PRIVATE as symbol);
}

type IPromiseObservableResetOptionsStrict = Required<IPromiseObservableResetOptions>;

interface IPromiseObservableOptionsStrict extends IPromiseObservableOptions {
  mode: TPromiseObservableMode;
  reset: IPromiseObservableResetOptionsStrict;
}

export function NormalizePromiseObservableOptions(options: IPromiseObservableOptions = {}): IPromiseObservableOptionsStrict {
  if (IsObject(options)) {
    let reset: IPromiseObservableResetOptions;
    if (options.reset === void 0) {
      reset = {};
    } else if (IsObject(options.reset)) {
      reset = options.reset;
    } else {
      throw new TypeError(`Expected object or void as PromiseObservable.options.reset`);
    }

    return {
      mode: NormalizeCompleteStateObserversMode(options.mode),
      reset: {
        immediate: (reset.immediate === void 0) ? false : Boolean(reset.immediate),
        complete: (reset.complete === void 0) ? false : Boolean(reset.complete),
        error: (reset.error === void 0) ? true : Boolean(reset.error),
      }
    };
  } else {
    throw new TypeError(`Expected object or void as PromiseObservable.options`);
  }
}


function PromiseObservableHookBasedOnSharedFactoryFunction<T>(emit: (value: TPromiseObservableNotifications<T>) => void): () => void {
  const instance: IPromiseObservable<T> = this;
  const privates: IPromiseObservablePrivate<T> = (instance as IPromiseObservableInternal<T>)[PROMISE_OBSERVABLE_PRIVATE];

  const reset = () => {
    emit(new Notification<'reset', void>(name, void 0));
  };

  const token: IPromiseCancelToken = new PromiseCancelToken();

  const promiseFactory = token.wrapFunction(privates.promiseFactory, 'never', (reason: any) => {
    // delay because onCancelled may be called immediately, from promiseFactory
    setImmediate(() => {
      emit(new Notification<'cancel', T>('cancel', reason));
      reset();
    });
  });

  (promiseFactory(token) as Promise<T | void>)
    .then(
      token.wrapFunction((value: T) => {
        emit(new Notification<'next', T>('next', value));
        emit(new Notification<'complete', void>('complete', void 0));
        if (privates.reset.complete) {
          reset();
        }
      }),
      token.wrapFunction((error: any) => {
        emit(new Notification<'error', T>('error', error));
        if (privates.reset.error) {
          reset();
        }
      })
    );

  return () => {
    token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
  };
}


// function PromiseObservableHookBasedOnSharedFactoryFunction<T>(emit: (value: TPromiseObservableNotifications<T>) => void, reset: () => void): () => void {
//   const instance: IPromiseObservable<T> = this;
//   const privates: IPromiseObservablePrivate<T> = (instance as IPromiseObservableInternal<T>)[PROMISE_OBSERVABLE_PRIVATE];
//
//   const token: IPromiseCancelToken = new PromiseCancelToken();
//
//   const tokenObserver = token.addListener('cancel', (reason: any) => {
//     tokenObserver.deactivate();
//     emit(new Notification<'cancel', T>('cancel', reason));
//     if (privates.reset.cancel) {
//       reset();
//     }
//   }).activate();
//
//   (token.wrapFunction(privates.promiseFactory)(token) as Promise<T | void>)
//     .then((value: T) => {
//       emit(new Notification<'next', T>('next', value));
//       emit(new Notification<'complete', void>('complete', void 0));
//       if (privates.reset.complete) {
//         reset();
//       }
//     }, (error: any) => {
//       emit(new Notification<'error', T>('error', error));
//       if (privates.reset.error) {
//         reset();
//       }
//     })
//     .then(() => {
//       tokenObserver.deactivate();
//     });
//
//   return () => {
//     tokenObserver.deactivate();
//     token.cancel(new Reason(`Observer stopped observing this promise`, 'CANCEL'));
//   };
// }

export function PromiseObservableFromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
  return new PromiseObservable<T>((_token: IPromiseCancelToken) => {
    if (token !== void 0) {
      _token.linkWithToken(token);
    }
    return promise;
  }, options);
}

export class PromiseObservable<T> extends CompleteStateObservable<T, IPromiseObservableKeyValueMap<T>> implements IPromiseObservable<T> {

  static fromPromise<T>(promise: Promise<T>, token?: IPromiseCancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T> {
    return PromiseObservableFromPromise<T>(promise, token, options);
  }

  constructor(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions) {
    const _options = NormalizePromiseObservableOptions(options);
    super(
      _options.reset.immediate
        ? BuildCompleteStateObservableHookBasedOnPerObserverFactoryFunction<T, IPromiseObservableKeyValueMap<T>>(PromiseObservableHookBasedOnSharedFactoryFunction)
        : BuildCompleteStateObservableHookBasedOnSharedFactoryFunction<T, IPromiseObservableKeyValueMap<T>>(PromiseObservableHookBasedOnSharedFactoryFunction),
      options
    );
    ConstructPromiseObservable<T>(this, promiseFactory, _options);
  }
}


/*
function doRequestWithTimeout(timeout: number = 60000, token?: PromiseCancelToken) {
  const _token = new PromiseCancelToken();

  setTimeout(() => {
    _token.cancel(new Reason(`Timeout reached`, 'TIMEOUT'));
  }, timeout);

  if (token !== void 0) {
    _token.linkWithToken(token);
  }

  return _token.wrapPromise(fetch(..._token.wrapFetchArguments('http://domain.com/request1')));
}
*/
