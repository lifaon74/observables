import { IAsyncDistinctValueObservable } from './interfaces';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import {
  DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE, IAsyncDistinctValueObservableInternal, IAsyncDistinctValueObservablePrivate
} from './privates';
import { AbortReason } from '../../../../misc/reason/defaults/abort-reason';
import { AdvancedAbortController } from '../../../../misc/advanced-abort-controller/implementation';
import { ICancellablePromiseTuple, IPromiseAndSignalTuple } from '../../../../promises/interfaces';
import { IAdvancedAbortController } from '../../../../misc/advanced-abort-controller/interfaces';
import { TAsyncDistinctValueObservableContextEmitFactory } from './context/types';
import { PromiseTry } from '../../../../promises/helpers';

/** FUNCTIONS **/

/**
 * TODO maybe emits should be chained (awaiting for previous emit) instead of cancelled
 * => Nope because previous promise may never resolve !
 *  => May use a "mode" to specify behaviour
 */
export function AsyncDistinctValueObservableEmit<T>(
  instance: IAsyncDistinctValueObservable<T>,
  factory: TAsyncDistinctValueObservableContextEmitFactory<T>
): Promise<T> {
  const privates: IAsyncDistinctValueObservablePrivate<T> = (instance as IAsyncDistinctValueObservableInternal<T>)[DISTINCT_ASYNC_VALUE_OBSERVABLE_PRIVATE];

  if (privates.controller !== null) {
    privates.controller.abort(new AbortReason('Emit before last one finished'));
  }

  const controller: IAdvancedAbortController =  new AdvancedAbortController();
  privates.controller = controller;
  privates.promise = PromiseTry<T>(() => factory.call(instance, controller.signal));

  return controller.signal.wrapPromise<T, 'never', never>(privates.promise)
    .then((value: T) => {
      privates.context.emit(value);
    });
}
