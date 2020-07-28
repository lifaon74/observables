import { TFunctionObservableFactory, TFunctionObservableParametersUnion } from './types';
import { IFunctionObservable } from './interfaces';
import { IObservable } from '../../../../core/observable/interfaces';
import { FUNCTION_OBSERVABLE_PRIVATE, IFunctionObservableInternal, IFunctionObservablePrivate } from './privates';

/** FUNCTIONS **/

/**
 * Stores 'value' on the correct place in 'privates.values' depending on 'argObservable' place
 */
export function FunctionObservableSetObservableValue<TFactory extends TFunctionObservableFactory>(
  instance: IFunctionObservable<TFactory>,
  argObservable: IObservable<TFunctionObservableParametersUnion<TFactory>>,
  value: TFunctionObservableParametersUnion<TFactory>
): void {
  const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
  let index: number = -1;
  while ((index = privates.args.indexOf(argObservable as any, index + 1)) !== -1) {
    (privates.values as any[])[index] = value;
  }
}

export function FunctionObservableCallFactory<TFactory extends TFunctionObservableFactory>(instance: IFunctionObservable<TFactory>): void {
  const privates: IFunctionObservablePrivate<TFactory> = (instance as IFunctionObservableInternal<TFactory>)[FUNCTION_OBSERVABLE_PRIVATE];
  privates.context.emit(
    privates.factory.apply(
      null,
      privates.values
    )
  );
}
