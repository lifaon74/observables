import {
  IFromIterableObservable, IFromIterableObservableConstructor, IFromIterableObservableTypedConstructor
} from './interfaces';
import {
  IFromIterableObservableKeyValueMap, IFromIterableObservableOptions, TFromIterableObservableConstructorArgs,
  TFromIterableObservableFinalState, TFromIterableObservableMode, TSyncOrAsyncIterable
} from './types';
import { Constructor } from '../../../../../../classes/class-helpers/types';
import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import { ConstructFromIterableObservable, IS_FROM_ITERABLE_OBSERVABLE_CONSTRUCTOR } from './constructor';
import { GetSetSuperArgsFunction, IsFactoryClass, MakeFactory } from '../../../../../../classes/class-helpers/factory';
import { GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow } from './hook-generators';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { IObservableTypedConstructor } from '../../../../../../core/observable/interfaces';
import { FiniteStateObservableFactory } from '../../../implementation';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { BaseClass, IBaseClassConstructor } from '../../../../../../classes/class-helpers/base-class';
import { IsFiniteStateObservableConstructor } from '../../../constructor';
import { KeyValueMapToNotifications } from '../../../../../core/notifications-observable/types';
import {
  IFromIterableObservableNormalizedArguments, NormalizeFromIterableObservableOptionsAndIterable
} from './functions';


/** CLASS AND FACTORY **/

export function PureFromIterableObservableFactory<TBase extends Constructor<IFiniteStateObservable<TSyncOrAsyncIterable<any>, TFromIterableObservableFinalState, TFromIterableObservableMode, IFromIterableObservableKeyValueMap<TSyncOrAsyncIterable<any>>>>>(superClass: TBase) {

  type TIterable = TSyncOrAsyncIterable<any>;

  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }

  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromIterableObservable extends superClass implements IFromIterableObservable<TIterable> {
    constructor(...args: any[]) {
      const [iterable, options]: TFromIterableObservableConstructorArgs<TIterable> = args[0];
      const normalizedArgs: IFromIterableObservableNormalizedArguments<TIterable> = NormalizeFromIterableObservableOptionsAndIterable<TIterable>(iterable, options);
      console.log('normalizedArgs', normalizedArgs);
      super(...setSuperArgs(args.slice(1), [
        GenerateFiniteStateObservableHookFromIterableWithPauseWorkflow<TIterable>(iterable, normalizedArgs.isAsync),
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
