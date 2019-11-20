import { IDistinctValueObservable } from './interfaces';
import {
  DISTINCT_VALUE_OBSERVABLE_PRIVATE, IDistinctValueObservableInternal, IDistinctValueObservablePrivate
} from './privates';
import { ObservableEmitAll } from '../../../../core/observable/functions';

/** FUNCTIONS **/

export function DistinctValueObservableEmit<T>(instance: IDistinctValueObservable<T>, value: T): void {
  const privates: IDistinctValueObservablePrivate<T> = (instance as IDistinctValueObservableInternal<T>)[DISTINCT_VALUE_OBSERVABLE_PRIVATE];
  if (value !== privates.value) {
    privates.value = value;
    privates.count++;
    ObservableEmitAll<T>(instance, value);
  }
}
