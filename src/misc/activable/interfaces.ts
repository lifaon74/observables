import { TPromiseOrValue } from '../../promises/interfaces';

export interface IActivableHook {
  activate(this: IActivable): TPromiseOrValue<void>;

  deactivate(this: IActivable): TPromiseOrValue<void>;
}

export type TActivableConstructorArgs = [IActivableHook];

export type TActivableSateListener = (this: IActivable, activated: boolean) => void;

export interface IActivableConstructor {
  new(hook: IActivableHook): IActivable;
}

export interface IActivable {
  readonly activated: boolean;

  activate(): Promise<void>;

  deactivate(): Promise<void>;

  addStateListener(listener: TActivableSateListener): () => void;

  // removeStateListener(listener: (state: TActivableState) => void): void;
}
