export type TActivableState = 'activated' | 'activating' | 'deactivated' | 'deactivating';

export interface IActivableHook {
  activate(): Promise<void>;

  deactivate(): Promise<void>;
}

export type TActivableConstructorArgs = [IActivableHook];

export interface IActivableConstructor {
  new(hook: IActivableHook): IActivable;
}

export interface IActivable {
  readonly state: TActivableState;
  readonly activated: boolean;

  activate(): Promise<void>;

  deactivate(): Promise<void>;
}
