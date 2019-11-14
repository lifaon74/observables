import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import { IFromReadableStreamObservable, IFromReadableStreamObservableConstructor } from './interfaces';
import { FiniteStateObservableFactory } from '../../../implementation';
import { IObservableConstructor } from '../../../../../../core/observable/interfaces';
import { GetSetSuperArgsFunction, IsFactoryClass, MakeFactory } from '../../../../../../classes/class-helpers/factory';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow } from './hook-generators';
import { Constructor } from '../../../../../../classes/class-helpers/types';
import { BaseClass, IBaseClassConstructor } from '../../../../../../classes/class-helpers/base-class';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { IsFiniteStateObservableConstructor } from '../../../constructor';
import {
  IFromReadableStreamObservableKeyValueMap, IFromReadableStreamObservableOptions,
  TFromReadableStreamObservableConstructorArgs, TFromReadableStreamObservableFinalState,
  TFromReadableStreamObservableMode
} from './types';
import { ConstructFromReadableStreamObservable, IS_FROM_READABLE_STREAM_CONSTRUCTOR } from './constructor';


/** CLASS AND FACTORY **/

export function PureFromReadableStreamObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }
  const setSuperArgs = GetSetSuperArgsFunction(IsFactoryClass(superClass));

  return class FromReadableStreamObservable extends superClass implements IFromReadableStreamObservable<T> {
    constructor(...args: any[]) {
      const [reader, options]: TFromReadableStreamObservableConstructorArgs<T> = args[0];
      super(...setSuperArgs(args.slice(1), [
        GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow<T>(reader),
        options
      ]));
      ConstructFromReadableStreamObservable<T>(this);
    }
  };
}

export let FromReadableStreamObservable: IFromReadableStreamObservableConstructor;

export function FromReadableStreamObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>>>(superClass: TBase) {
  return MakeFactory<IFromReadableStreamObservableConstructor, [], TBase>(PureFromReadableStreamObservableFactory, [], superClass, {
    name: 'FromReadableStreamObservable',
    instanceOf: FromReadableStreamObservable,
    waterMarks: [IS_FROM_READABLE_STREAM_CONSTRUCTOR],
  });
}

export function FromReadableStreamObservableBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IFromReadableStreamObservableConstructor, [
    IFiniteStateObservableTypedConstructor<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>,
    INotificationsObservableTypedConstructor<IFromReadableStreamObservableKeyValueMap<any>>,
    IObservableConstructor
  ], TBase>(PureFromReadableStreamObservableFactory, [FiniteStateObservableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'FromReadableStreamObservable',
    instanceOf: FromReadableStreamObservable,
    waterMarks: [IS_FROM_READABLE_STREAM_CONSTRUCTOR],
  });
}

FromReadableStreamObservable = class FromReadableStreamObservable extends FromReadableStreamObservableBaseFactory<IBaseClassConstructor>(BaseClass) {
  constructor(reader: ReadableStreamReader<any>, options?: IFromReadableStreamObservableOptions) {
    super([reader, options], [], [], []);
  }
} as IFromReadableStreamObservableConstructor;
