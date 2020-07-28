import { IDistinctValueObservable, IDistinctValueObservableTypedConstructor } from './interfaces';
import {
  DISTINCT_VALUE_OBSERVABLE_PRIVATE, IDistinctValueObservableInternal, IDistinctValueObservablePrivate
} from './privates';
import { CreateObservableEmitter, ObservableEmitAll } from '../../../../core/observable/functions';
import { IObservable } from '../../../../core/observable/interfaces';
import { DistinctValueObservable } from './implementation';

/** FUNCTIONS **/

/* PUBLIC */

export function ReadDistinctValueObservable<GValue>(observable: IObservable<GValue>, ifUndefined: 'skip' | 'warn' | 'throw' = 'throw'): GValue {
  let value: GValue;
  observable
    .pipeTo((_value: GValue) => {
      value = _value;
    })
    .activate()
    .deactivate();

  if (
    // @ts-ignore
    (value === void 0)
    && (ifUndefined !== 'skip')
  ) {
    switch (ifUndefined) {
      case 'throw':
        throw new Error(`Value is undefined`);
      case 'warn':
        console.warn('Value is undefined');
        break;
      default:
        throw new Error(`Unexpected ifUndefined value: ${ ifUndefined }`);
    }
  }
  // @ts-ignore
  return value;
}

export function CreateDistinctObservableEmitter<GValue>(value?: GValue) {
  const result = CreateObservableEmitter<IDistinctValueObservableTypedConstructor<GValue>>(DistinctValueObservable);
  if (value !== void 0) {
    result[1].emit(value);
  }
  return result;
}

/* INTERNAL */

export function DistinctValueObservableEmit<GValue>(instance: IDistinctValueObservable<GValue>, value: GValue): void {
  const privates: IDistinctValueObservablePrivate<GValue> = (instance as IDistinctValueObservableInternal<GValue>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE];
  if (value !== privates.value) {
    privates.value = value;
    privates.count++;
    ObservableEmitAll<GValue>(instance, value);
  }
}


