import { IUnit, IUnitConstructor, IUnitOptions, TUnitOrValue } from '../interfaces';


/** INTERFACES & TYPES **/

export interface INumericUnitOptions extends IUnitOptions<number> {
}

export type TNumericUnitOrValue = INumericUnit | IUnit<number> | number;

export type TNumericUnitToReturn<TTo> = TTo extends number ? INumericUnit : IUnit<TTo>;
export type TNumericUnitToOptionsReturn<TTo> = TTo extends number ? INumericUnitOptions : IUnitOptions<TTo>;

/** CLASS **/

export interface INumericUnitConstructor extends Omit<IUnitConstructor, 'new'>{
  new<T>(options: INumericUnitOptions): INumericUnit;
}

export interface INumericUnit extends IUnit<number> {

  to<TTo>(unit: string): TNumericUnitToReturn<TTo>;
  to<TTo>(unit: string): IUnit<TTo>;

  /** ARITHMETIC **/

  add(...values: TNumericUnitOrValue[]): INumericUnit;

  sub(...values: TNumericUnitOrValue[]): INumericUnit;

  mul(...values: TNumericUnitOrValue[]): INumericUnit;

  div(...values: TNumericUnitOrValue[]): INumericUnit;

  /** MATH **/

  min(...values: TNumericUnitOrValue[]): INumericUnit;

  max(...values: TNumericUnitOrValue[]): INumericUnit;
}
