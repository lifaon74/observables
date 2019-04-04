
export interface IPreventableConstructor {
  new<N extends string = 'default'>(): IPreventable<N>;
}

export interface IPreventable<N extends string = 'default'> {
  isPrevented(name?: N): boolean
  prevent(name?: N): void;
}