import {
  INumericUnit, INumericUnitOptions, TNumericUnitOrValue, TNumericUnitToOptionsReturn, TNumericUnitToReturn
} from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import {
  ConvertUnitOrConstantToOtherUnitValue, ConvertUnitToOtherUnitValue, IsValidUnit, Unit, UnitToOptions
} from '../implementation';
import { IUnit, IUnitOptions } from '../interfaces';

/** CONSTRUCTOR **/
export const NUMERIC_UNIT_PRIVATE = Symbol('numerir-unit-private');

export interface INumericUnitPrivate {

}

export interface INumericUnitInternal extends INumericUnit {
  [NUMERIC_UNIT_PRIVATE]: INumericUnitPrivate;
}

export function ConstructNumericUnit(
  instance: INumericUnit,
  options: INumericUnitOptions
): void {
  ConstructClassWithPrivateMembers(instance, NUMERIC_UNIT_PRIVATE);
  const privates: INumericUnitPrivate = (instance as INumericUnitInternal)[NUMERIC_UNIT_PRIVATE];
  if (IsObject(options)) {
    if (typeof options.value !== 'number') {
      throw new TypeError(`Expected number as NumericUnit.value`);
    }
  } else {
    throw new TypeError(`Expected object as NumericUnit.options`);
  }
}

export function IsNumericUnit(value: any): value is INumericUnit {
  return IsObject(value)
    && value.hasOwnProperty(NUMERIC_UNIT_PRIVATE as symbol);
}


/** FUNCTIONS **/

const add = (a: number, b: number) => (a + b);
const sub = (a: number, b: number) => (a - b);
const mul = (a: number, b: number) => (a * b);
const div = (a: number, b: number) => (a / b);


export function NumericUnitReduce(instance: NumericUnit, values: TNumericUnitOrValue[], reducer: (previousValue: number, currentValue: number) => number): number {
  return values.reduce((value: number, unit: TNumericUnitOrValue) => {
    return reducer(value, ConvertUnitOrConstantToOtherUnitValue<number>(unit, instance.unit));
  }, instance.value);
}

export function NumericUnitReduceOperation(instance: NumericUnit, values: TNumericUnitOrValue[], reducer: (previousValue: number, currentValue: number) => number): INumericUnit {
  return new NumericUnit({
    value: NumericUnitReduce(instance, values, add),
    unit: instance.unit,
  });
}


/** METHODS **/


export function NumericUnitTo<TTo>(instance: INumericUnit, unit: string): INumericUnit | IUnit<TTo> {
  const options: IUnitOptions<TTo> = UnitToOptions(instance, unit);
  return (typeof options.value === 'number')
    ? new Unit<TTo>(options)
    : new NumericUnit(options as unknown as INumericUnitOptions);
}

export function NumericUnitAdd(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, add);
}

export function NumericUnitSub(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, sub);
}

export function NumericUnitMul(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, mul);
}

export function NumericUnitDiv(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, div);
}

export function NumericUnitMin(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, Math.min);
}

export function NumericUnitMax(instance: INumericUnit, values: TNumericUnitOrValue[]): INumericUnit {
  return NumericUnitReduceOperation(instance, values, Math.max);
}

/** CLASS **/

export class NumericUnit extends Unit<number> implements INumericUnit {

  constructor(options: INumericUnitOptions) {
    super(options);
    ConstructNumericUnit(this, options);
  }

  to<TTo>(unit: string): TNumericUnitToReturn<TTo>;
  to<TTo>(unit: string): IUnit<TTo>;
  to<TTo>(unit: string): INumericUnit | IUnit<TTo> {
    return NumericUnitTo<TTo>(this, unit);
  }

  /** ARITHMETIC **/

  add(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitAdd(this, values);
  }

  sub(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitSub(this, values);
  }

  mul(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitMul(this, values);
  }

  div(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitDiv(this, values);
  }

  /** MATH **/

  min(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitMin(this, values);
  }

  max(...values: TNumericUnitOrValue[]): INumericUnit {
    return NumericUnitMax(this, values);
  }
}

