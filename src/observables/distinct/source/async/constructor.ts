import { IAsyncSource } from './interfaces';
import { IAsyncDistinctValueObservableContext } from '../../distinct-value-observable/async/context/interfaces';
import { ASYNC_SOURCE_PRIVATE, IAsyncSourceInternal } from './privates';
import { IsObject } from '../../../../helpers';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

/** CONSTRUCTOR **/

export function ConstructAsyncSource<T>(instance: IAsyncSource<T>, context: IAsyncDistinctValueObservableContext<T>): void {
  ConstructClassWithPrivateMembers(instance, ASYNC_SOURCE_PRIVATE);
  (instance as IAsyncSourceInternal<T>)[ASYNC_SOURCE_PRIVATE].context = context;
}

export function IsAsyncSource(value: any): value is IAsyncSource<any> {
  return IsObject(value)
    && value.hasOwnProperty(ASYNC_SOURCE_PRIVATE as symbol);
}
