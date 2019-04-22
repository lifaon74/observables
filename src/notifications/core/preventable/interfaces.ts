
export type TDefaultPreventable = 'default';

export interface IPreventableConstructor {
  new<N extends TDefaultPreventable = 'default'>(): IPreventable<N>;
}

export interface IPreventable<N extends TDefaultPreventable = 'default'> {
  isPrevented(name?: N): boolean;
  prevent(name?: N): this;
}