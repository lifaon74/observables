import {
  TAsyncFunctionObservableFactory, TAsyncFunctionObservableFactoryReturnType, TAsyncFunctionObservableParametersUnion
} from './types';
import { IAsyncFunctionObservable } from './interfaces';
import {
  ASYNC_FUNCTION_OBSERVABLE_PRIVATE, IAsyncFunctionObservableInternal, IAsyncFunctionObservablePrivate
} from './privates';
import { IAdvancedAbortSignal } from '../../../../misc/advanced-abort-controller/advanced-abort-signal/interfaces';
import { IObservable } from '../../../../core/observable/interfaces';

/** FUNCTIONS **/

export function AsyncFunctionObservableSetObservableValue<TFactory extends TAsyncFunctionObservableFactory>(
  instance: IAsyncFunctionObservable<TFactory>,
  argObservable: IObservable<TAsyncFunctionObservableParametersUnion<TFactory>>,
  value: TAsyncFunctionObservableParametersUnion<TFactory>
): void {
  const privates: IAsyncFunctionObservablePrivate<TFactory> = (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];
  let index: number = -1;
  while ((index = privates.args.indexOf(argObservable as any, index + 1)) !== -1) {
    (privates.values as any[])[index] = value;
  }
}

export function AsyncFunctionObservableCallFactory<TFactory extends TAsyncFunctionObservableFactory>(
  instance: IAsyncFunctionObservable<TFactory>
): Promise<void> {
  const privates: IAsyncFunctionObservablePrivate<TFactory> = (instance as IAsyncFunctionObservableInternal<TFactory>)[ASYNC_FUNCTION_OBSERVABLE_PRIVATE];

  return privates.context.emit((signal: IAdvancedAbortSignal) => {
    return privates.factory.apply(
      null,
      [signal].concat(privates.values)
    ) as TAsyncFunctionObservableFactoryReturnType<TFactory>;
  })
    .then(() => {
    });
}
