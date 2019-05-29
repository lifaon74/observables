import {
  IInputOutput, IInputOutputBaseConstructor, IInputOutputBaseOptions, IInputOutputConstructor, IInputOutputKeyValueMap,
  IInputOutputConstructorSimple,
  IInputOutputSuperClass, IOKeyValueMapGenericConstraint, TInputOutputBaseOptionsForSuperResult,
  TInputOutputBaseOptionsForSuperResultSimple, TInputOutputConstructorArgs
} from './interfaces';
import { IObservable, IObservableConstructor } from '../../../core/observable/interfaces';
import { IObserver } from '../../../core/observer/interfaces';
import { Constructor, HasFactoryWaterMark, MakeFactory, TMakeFactoryClass } from '../../../classes/factory';
import {
  INotificationsObservableTypedConstructor, KeyValueMapToNotifications
} from '../../../notifications/core/notifications-observable/interfaces';
import { IObservablePrivate, OBSERVABLE_PRIVATE, ObservableFactory } from '../../../core/observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import {
  ACTIVABLE_PRIVATE, ActivableFactory, IActivablePrivate, IsActivableConstructor
} from '../../../classes/activable/implementation';
import { IsObject } from '../../../helpers';
import {
  IsNotificationsObservableConstructor, NotificationsObservableFactory
} from '../../../notifications/core/notifications-observable/implementation';
import { IActivableConstructor } from '../../../classes/activable/interfaces';


export const INPUT_OUTPUT_PRIVATE = Symbol('input-output-private');

export interface IInputOutputPrivate<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> {
  in: TObservable;
  out: TObserver;
}

export interface IInputOutputInternal<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends IInputOutput<TKVMap, TObservable, TObserver> {
  [OBSERVABLE_PRIVATE]: IObservablePrivate<KeyValueMapToNotifications<TKVMap>>;
  [ACTIVABLE_PRIVATE]: IActivablePrivate;
  [INPUT_OUTPUT_PRIVATE]: IInputOutputPrivate<TKVMap, TObservable, TObserver>;
}


export function ConstructInputOutput<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>>(
  instance: IInputOutput<TKVMap, TObservable, TObserver>,
  observable: TObservable,
  observer: TObserver,
) {
  ConstructClassWithPrivateMembers(instance, INPUT_OUTPUT_PRIVATE);
  (instance as IInputOutputInternal<TKVMap, TObservable, TObserver>)[INPUT_OUTPUT_PRIVATE].in = observable;
  (instance as IInputOutputInternal<TKVMap, TObservable, TObserver>)[INPUT_OUTPUT_PRIVATE].out = observer;
}

export function IsInputOutput(value: any): value is IInputOutput<IInputOutputKeyValueMap, any, any> {
  return IsObject(value)
    && value.hasOwnProperty(INPUT_OUTPUT_PRIVATE);
}

const IS_INPUT_OUTPUT_CONSTRUCTOR = Symbol('is-input-output-constructor');

export function IsInputOutputConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_INPUT_OUTPUT_CONSTRUCTOR, direct);
}


function PureInputOutputFactory<TBase extends Constructor<IInputOutputSuperClass<IInputOutputKeyValueMap>>>(superClass: TBase) {
  type TKVMap = IInputOutputKeyValueMap;
  type TObservable = IObservable<any>;
  type TObserver = IObserver<any>;

  if (!IsNotificationsObservableConstructor(superClass, false)) {
    throw new TypeError(`Expected Observables' constructor as superClass`);
  }

  if (!IsActivableConstructor(superClass, false)) {
    throw new TypeError(`Expected Activable's constructor as superClass`);
  }

  return class InputOutput extends superClass implements IInputOutput<TKVMap, TObservable, TObserver> {
    constructor(...args: any[]) {
      const [observable, observer]: TInputOutputConstructorArgs<TKVMap, TObservable, TObserver> = args[0];
      super(...args.slice(1));
      ConstructInputOutput<TKVMap, TObservable, TObserver>(this, observable, observer);
    }

    get in(): TObservable {
      return ((this as unknown) as IInputOutputInternal<TKVMap, TObservable, TObserver>)[INPUT_OUTPUT_PRIVATE].in;
    }

    get out(): TObserver {
      return ((this as unknown) as IInputOutputInternal<TKVMap, TObservable, TObserver>)[INPUT_OUTPUT_PRIVATE].out;
    }
  };
}

export let InputOutput: IInputOutputBaseConstructor;

export function InputOutputFactory<TBase extends Constructor<IInputOutputSuperClass<IInputOutputKeyValueMap>>>(superClass: TBase) {
  return MakeFactory<IInputOutputConstructorSimple, [], TBase>(PureInputOutputFactory, [], superClass, {
    name: 'InputOutput',
    instanceOf: InputOutput,
    waterMarks: [IS_INPUT_OUTPUT_CONSTRUCTOR],
  });
}

export function InputOutputBaseFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IInputOutputConstructorSimple, [IActivableConstructor, INotificationsObservableTypedConstructor<IInputOutputKeyValueMap>, IObservableConstructor], TBase>(PureInputOutputFactory, [ActivableFactory, NotificationsObservableFactory, ObservableFactory], superClass, {
    name: 'InputOutput',
    instanceOf: InputOutput,
    waterMarks: [IS_INPUT_OUTPUT_CONSTRUCTOR],
  });
}


/*----------------------------------*/

export function InputOutputBaseOptionsForSuper<TKVMap extends IOKeyValueMapGenericConstraint<TKVMap>, TObservable extends IObservable<any>, TObserver extends IObserver<any>>(
  options: IInputOutputBaseOptions<TKVMap, TObservable, TObserver>
): TInputOutputBaseOptionsForSuperResult<TKVMap, TObservable, TObserver> {
  return [
    [
      options.observable,
      options.observer
    ], [{
      activate: options.activate,
      deactivate: options.deactivate,
    }], [
      options.create/* as ((context: INotificationsObservableContext<any>) => (TNotificationsObservableHook<any> | void))*/
    ],
    []
  ];
}

InputOutput = class InputOutput<TObservable extends IObservable<any>, TObserver extends IObserver<any>> extends InputOutputBaseFactory<ObjectConstructor>(Object) {
  constructor(options: IInputOutputBaseOptions<IInputOutputKeyValueMap, TObservable, TObserver>) {
    super(...InputOutputBaseOptionsForSuper<IInputOutputKeyValueMap, TObservable, TObserver>(options) as TInputOutputBaseOptionsForSuperResultSimple<TObservable, TObserver>);
  }
} as IInputOutputBaseConstructor;


