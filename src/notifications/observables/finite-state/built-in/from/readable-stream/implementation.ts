import { IFiniteStateObservable, IFiniteStateObservableTypedConstructor } from '../../../interfaces';
import { IFromReadableStreamObservable, IFromReadableStreamObservableConstructor } from './interfaces';
import { FiniteStateObservableFactory } from '../../../implementation';
import { IObservableConstructor } from '../../../../../../core/observable/interfaces';
import { NotificationsObservableFactory } from '../../../../../core/notifications-observable/implementation';
import { INotificationsObservableTypedConstructor } from '../../../../../core/notifications-observable/interfaces';
import { GenerateFiniteStateObservableHookFromReadableStreamReaderWithPauseWorkflow } from './hook-generators';
import { ObservableFactory } from '../../../../../../core/observable/implementation';
import { IsFiniteStateObservableConstructor } from '../../../constructor';
import {
  IFromReadableStreamObservableKeyValueMap, IFromReadableStreamObservableOptions,
  TFromReadableStreamObservableConstructorArgs, TFromReadableStreamObservableFinalState,
  TFromReadableStreamObservableMode
} from './types';
import { ConstructFromReadableStreamObservable, IS_FROM_READABLE_STREAM_CONSTRUCTOR } from './constructor';
import {
  BaseClass, Constructor, GenerateOverrideSuperArgumentsFunction, IBaseClassConstructor, MakeFactory, OwnArguments,
  SuperArguments
} from '@lifaon/class-factory';
import { TFiniteStateObservableConstructorArgs } from '../../../types';


/** CLASS AND FACTORY **/

export function PureFromReadableStreamObservableFactory<TBase extends Constructor<IFiniteStateObservable<any, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<any>>>>(superClass: TBase) {
  type T = any;
  if (!IsFiniteStateObservableConstructor(superClass)) {
    throw new TypeError(`Expected FiniteStateObservableConstructor as superClass`);
  }

  const overrideFiniteStateObservableArguments = GenerateOverrideSuperArgumentsFunction<TFiniteStateObservableConstructorArgs<T, TFromReadableStreamObservableFinalState, TFromReadableStreamObservableMode, IFromReadableStreamObservableKeyValueMap<T>>>(
    superClass,
    IsFiniteStateObservableConstructor
  );


  return class FromReadableStreamObservable extends superClass implements IFromReadableStreamObservable<T> {
    constructor(...args: any[]) {
      const [reader, options]: TFromReadableStreamObservableConstructorArgs<T> = OwnArguments<TFromReadableStreamObservableConstructorArgs<T>>(args);
      super(...overrideFiniteStateObservableArguments(SuperArguments(args), () => [
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
