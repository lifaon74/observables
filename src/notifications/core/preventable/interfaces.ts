export interface IPreventableConstructor {
  new<N extends string>(): IPreventable<N>;
}

export interface IPreventable<N extends string> {
  isPrevented(name: N): boolean;

  prevent(name: N): this;
}


export interface IBasicPreventableConstructor {
  new(): IBasicPreventable;
}

export interface IBasicPreventable extends IPreventable<'default'> {
  isPrevented(): boolean;

  prevent(): this;
}


