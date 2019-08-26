import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { Constructor, HasFactoryWaterMark, MakeFactory } from '../../classes/factory';
import {
  IActivable, IActivableConstructor, IActivableHook, TActivableConstructorArgs, TActivableSateListener
} from './interfaces';
import { IsObject } from '../../helpers';


export const ACTIVABLE_PRIVATE = Symbol('activable-private');

export interface IActivablePrivate {
  activated: boolean;
  promise: Promise<void>;
  listeners: Map<TActivableSateListener, () => void>;

  activate(): Promise<void>;

  deactivate(): Promise<void>;
}

export interface IActivableInternal extends IActivable {
  [ACTIVABLE_PRIVATE]: IActivablePrivate;
}

export function ConstructActivable(instance: IActivable, hook: IActivableHook): void {
  ConstructClassWithPrivateMembers(instance, ACTIVABLE_PRIVATE);
  const privates: IActivablePrivate = (instance as IActivableInternal)[ACTIVABLE_PRIVATE];

  privates.activated = false;
  privates.promise = Promise.resolve();
  privates.listeners = new Map<TActivableSateListener, () => void>();

  const activate = hook.activate;
  privates.activate = () => {
    return new Promise<void>((resolve: any) => {
      resolve(activate.call(instance));
    });
  };

  const deactivate = hook.deactivate;
  privates.deactivate = () => {
    return new Promise<void>((resolve: any) => {
      resolve(deactivate.call(instance));
    });
  };
}

export function IsActivable(value: any): value is IActivable {
  return IsObject(value)
    && value.hasOwnProperty(ACTIVABLE_PRIVATE as symbol);
}

const IS_ACTIVABLE_CONSTRUCTOR = Symbol('is-activable-constructor');

export function IsActivableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_ACTIVABLE_CONSTRUCTOR, direct);
}


export function ActivableActivate(instance: IActivable): Promise<void> {
  const privates: IActivablePrivate = (instance as IActivableInternal)[ACTIVABLE_PRIVATE];
  if (!privates.activated) {
    privates.promise = privates.promise
      .catch(() => {}) // discard previous errors
      .then(() => {
        return privates.activate()
          .then(() => {
            ActivableSetState(instance, true);
          }, (error: any) => {
            return privates.deactivate()
              .then(() => Promise.reject(error));
          });
      });
  }
  return privates.promise;
}

export function ActivableDeactivate(instance: IActivable): Promise<void> {
  const privates: IActivablePrivate = (instance as IActivableInternal)[ACTIVABLE_PRIVATE];
  if (privates.activated) {
    privates.promise = privates.promise
      .catch(() => {}) // discard previous errors
      .then(() => {
        return privates.deactivate()
          .then(() => {
            ActivableSetState(instance, false);
          }, (error: any) => {
            console.error('deactivate should never fail !');
            ActivableSetState(instance, false);
            return Promise.reject(error);
          });
      });
  }
  return privates.promise;
}

function ActivableSetState(instance: IActivable, activated: boolean): void {
  const privates: IActivablePrivate = (instance as IActivableInternal)[ACTIVABLE_PRIVATE];
  if (activated !== privates.activated) { // should be an optional check => must always be true
    privates.activated = activated;
    const iterator: Iterator<TActivableSateListener> = privates.listeners.keys();
    let result: IteratorResult<TActivableSateListener>;
    while (!(result = iterator.next()).done) {
      result.value.call(instance, activated);
    }
  } else {
    console.warn(`invalid ActivableSetState`);
  }
}

export function ActivableAddStateListener(instance: IActivable, listener: TActivableSateListener): () => void {
  const privates: IActivablePrivate = (instance as IActivableInternal)[ACTIVABLE_PRIVATE];
  if (privates.listeners.has(listener)) {
    return privates.listeners.get(listener) as () => void;
  } else {
    let cleared: boolean = false;
    const clear = () => {
      if (!cleared) {
        cleared = true;
        privates.listeners.delete(listener);
      }
    };
    privates.listeners.set(listener, clear);
    return clear;
  }
}


function PureActivableFactory<TBase extends Constructor>(superClass: TBase) {
  return class Activable extends superClass implements IActivable {
    constructor(...args: any[]) {
      const [hook]: TActivableConstructorArgs = args[0];
      super(...args.slice(1));

      ConstructActivable(this, hook);
    }

    get activated(): boolean {
      return ((this as unknown) as IActivableInternal)[ACTIVABLE_PRIVATE].activated;
    }

    activate(): Promise<void> {
      return ActivableActivate(this);
    }

    deactivate(): Promise<void> {
      return ActivableDeactivate(this);
    }

    addStateListener(listener: TActivableSateListener): () => void {
      return ActivableAddStateListener(this, listener);
    }
  };
}

export let Activable: IActivableConstructor;

export function ActivableFactory<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IActivableConstructor, [], TBase>(PureActivableFactory, [], superClass, {
    name: 'Activable',
    instanceOf: Activable,
    waterMarks: [IS_ACTIVABLE_CONSTRUCTOR]
  });
}

Activable = class Activable extends ActivableFactory<ObjectConstructor>(Object) {
  constructor(hook: IActivableHook) {
    super([hook]);
  }
};
