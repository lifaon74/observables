import { ISource } from './interfaces';
import { IsObject } from '../../../../helpers';
import { ISourceInternal, SOURCE_PRIVATE } from './privates';
import { IObservableContext } from '../../../../core/observable/context/interfaces';
import { ConstructClassWithPrivateMembers } from '../../../../misc/helpers/ClassWithPrivateMembers';

/** CONSTRUCTOR **/

export function ConstructSource<T>(instance: ISource<T>, context: IObservableContext<T>): void {
  ConstructClassWithPrivateMembers(instance, SOURCE_PRIVATE);
  (instance as ISourceInternal<T>)[SOURCE_PRIVATE].context = context;
}

export function IsSource(value: any): value is ISource<any> {
  return IsObject(value)
    && value.hasOwnProperty(SOURCE_PRIVATE as symbol);
}
