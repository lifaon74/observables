import {
  IFromIterableObservable, IFromIterableObservableConstructor, IFromIterableObservableTypedConstructor
} from './interfaces';
import {
  IFromIterableObservableKeyValueMap, IFromIterableObservableOptions, TFromIterableObservableConstructorArgs,
  TFromIterableObservableFinalState, TFromIterableObservableMode
} from './types';
import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import { ConstructFromIterableObservable, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR } from './constructor';
import { GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow } from './hook-generators';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { IObservableTypedConstructor } from '../../../../../../core/observable/interfaces';
import { FiniteStateObservableFactory } from '../../../implementation';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { IsFiniteStateObservableConstructor } from '../../../constructor';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import {
  IFromIterableObservableNormalizedArguments, NormalizeFromIterableObservableOptionsAndIterable
} from './functions';
import {
  TInferSyncOrAsyncIterableValueType, TSyncOrAsyncIterable
} from '../../../../../../misc/helpers/iterators/interfaces';
import {
  BaseClass, Constructor, GenerateOverrideSuperArgumentsFunction, IBaseClassConstructor, MakeFactory, OwnArguments,
  SuperArguments
} from '@lifaon/class-factory';
import { TFiniteStateObservableConstructorArgs } from '../../../types';


/** CLASS AND FACTORY **/

export function PureFromIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<TSyncOrAsyncIterable<any>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TSyncOrAsyncIterable<any>>>>>(superClass: TBase) {

  type TIterable = TSyncOrAsyncIterable<any>;

  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }

  const overrideFiniteStateObservableArguments = GenerateOverrideSuperArgumentsFunction<TFiniteStateObservableConstructorArgs<TInferSyncOrAsyncIterableValueType<TIterable>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TIterable>>>(
    superClass,
    IsFiniteStateObservableConstructor
  );

  return class FromIterableObservable extends superClass implements IFromIterableObservable<TIterable> {
    constructor(...args: any[]) {
      const [iterable, options]: TFromIterableObservableConstructorArgs<TIterable> = OwnArguments<TFromIterableObservableConstructorArgs<TIterable>>(args);
      const normalizedArgs: IFromIterableObservableNormalizedArguments<TIterable> = NormalizeFromIterableObservableOptionsAndIterable<TIterable>(iterable, options);
      super(...overrideFiniteStateObservableArguments(SuperArguments(args), () => [
        GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<TIterable>(iterable),
        normalizedArgs
      ]));
      ConstructFromIterableObservable<TIterable>(this, normalizedArgs);
    }
  };
}

export let FromIterableObservable: IFromIterableObservableConstructor;

export function FromIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<any>>>,
  TIterable extends TSyncOrAsyncIterable<any>>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableTypedConstructor<TIterable>, [], TBase>(PureFromIterableObservableFactory, [], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

export function FromIterableObservableBaseFactory<TBase extends Constructor, TIterable extends TSyncOrAsyncIterable<any> = TSyncOrAsyncIterable<any>>(superClass: TBase) {
  return MakeFactory<IFromIterableObservableTypedConstructor<TIterable>, [
    IFiniteStateObservableTypedConstructor<any, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<IFromIterableObservableKeyValueMap<any>>,
    IObservableTypedConstructor<KeyValueMapToNotifications<IFromIterableObservableKeyValueMap<any>>>
  ], TBase>(PureFromIterableObservableFactory, [FiniteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromIterableObservable',
    instanceOf: FromIterableObservable,
    waterMarks: [IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR],
  });
}

FromIterableObservable = class FromIterableObservable extends FromIterableObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(iterable: Iterable<any>, options?: IFromIterableObservableOptions) {
    super([iterable, options], [], [], []);
  }
} as IFromIterableObservableConstructor;
