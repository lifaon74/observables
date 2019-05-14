import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { Constructor, HasFactoryWaterMark, MakeFactory } from '../factory';
import {
  IActivable, IActivableConstructor, IActivableHook, TActivableConstructorArgs, TActivableState
} from './interfaces';
import { IsObject } from '../../helpers';


export const ACTIVABLE_PRIVATE = Symbol('activable-private');

export interface IActivablePrivate {
  state: TActivableState;
  activatePromise: Promise<void>;
  deactivatePromise: Promise<void>;
  activate(): Promise<void>;
  deactivate(): Promise<void>;
}

export interface IActivableInternal extends IActivable {
  [ACTIVABLE_PRIVATE]: IActivablePrivate;
}

export function ConstructActivable(activable: IActivable, hook: IActivableHook): void {
  ConstructClassWithPrivateMembers(activable, ACTIVABLE_PRIVATE);
  const privates: IActivablePrivate = (activable as IActivableInternal)[ACTIVABLE_PRIVATE];

  privates.state = 'deactivated';
  privates.activatePromise = Promise.resolve();
  privates.deactivatePromise = Promise.resolve();

  const activate = hook.activate.bind(activable);
  privates.activate = () => {
    return new Promise((resolve: any) => {
      resolve(activate());
    });
  };

  const deactivate = hook.deactivate.bind(activable);
  privates.deactivate = () => {
    return new Promise((resolve: any) => {
      resolve(deactivate());
    });
  };
}

export function IsActivable(value: any): value is IActivable {
  return IsObject(value)
    && value.hasOwnProperty(ACTIVABLE_PRIVATE);
}

const IS_ACTIVABLE_CONSTRUCTOR = Symbol('is-activable-constructor');
export function IsActivableConstructor(value: any, direct?: boolean): boolean {
  return (typeof value === 'function')
    && HasFactoryWaterMark(value, IS_ACTIVABLE_CONSTRUCTOR, direct);
}



export function ActivableActivate(activable: IActivable): Promise<void> {
  const privates: IActivablePrivate = (activable as IActivableInternal)[ACTIVABLE_PRIVATE];
  if ((privates.state === 'deactivated') || (privates.state === 'deactivating')) {
    ActivableSetState(activable, 'activating');
    return privates.deactivatePromise.then(() => {
      // assert state is deactivated
      return privates.activatePromise = privates.activate()
        .then(() => {
          ActivableSetState(activable, 'activated');
        }, (error: any) => {
          return privates.deactivate()
            .then(() => Promise.reject(error));
        });
    });
  } else {
    return privates.activatePromise;
  }
}

export function ActivableDeactivate(activable: IActivable): Promise<void> {
  const privates: IActivablePrivate = (activable as IActivableInternal)[ACTIVABLE_PRIVATE];
  if ((privates.state === 'activated') || (privates.state === 'activating')) {
    ActivableSetState(activable, 'deactivating');
    return privates.activatePromise.then(() => {
      // assert state is activated
      return privates.deactivatePromise = privates.deactivate()
        .then(() => {
          ActivableSetState(activable, 'deactivated');
        }, (error: any) => {
          console.error('_deactivate should never fail !');
          ActivableSetState(activable, 'deactivated');
          return Promise.reject(error);
        });
    });
  } else {
    return privates.deactivatePromise;
  }
}

export function ActivableSetState(activable: IActivable, state: TActivableState): void {
  if (state !== (activable as IActivableInternal)[ACTIVABLE_PRIVATE].state) {
    (activable as IActivableInternal)[ACTIVABLE_PRIVATE].state = state;
  }
}

function PureActivableFactory<TBase extends Constructor>(superClass: TBase) {
  return class Activable extends superClass implements IActivable {
    constructor(...args: any[]) {
      const [hook]: TActivableConstructorArgs = args[0];
      super(...args.slice(1));

      ConstructActivable(this, hook);
    }

    get state(): TActivableState {
      return ((this as unknown) as IActivableInternal)[ACTIVABLE_PRIVATE].state;
    }

    get activated(): boolean {
      return ((this as unknown) as IActivableInternal)[ACTIVABLE_PRIVATE].state === 'activated';
    }

    activate(): Promise<void> {
      return ActivableActivate(this);
    }

    deactivate(): Promise<void> {
      return ActivableDeactivate(this);
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
