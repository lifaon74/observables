import { IUnit, IUnitOptions, TUnitOrValue } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IsObject } from '../../../helpers';
import { GetTypeConverterOrThrow } from './converters/register';

/** CONSTRUCTOR **/
export const UNIT_PRIVATE = Symbol('unit-private');

export interface IUnitPrivate<T> {
  value: T;
  unit: string;
}

export interface IUnitInternal<T> extends IUnit<T> {
  [UNIT_PRIVATE]: IUnitPrivate<T>;
}

export function ConstructUnit<T>(
  instance: IUnit<T>,
  options: IUnitOptions<T>
): void {
  ConstructClassWithPrivateMembers(instance, UNIT_PRIVATE);
  const privates: IUnitPrivate<T> = (instance as IUnitInternal<T>)[UNIT_PRIVATE];
  if (IsObject(options)) {
    privates.value = options.value;

    if (!IsValidUnit(options.unit)) {
      privates.unit = options.unit;
    } else {
      throw new TypeError(`Expected non empty string as Unit.options.unit`);
    }
  } else {
    throw new TypeError(`Expected object as Unit.options`);
  }
}

export function IsUnit(value: any): value is IUnit<any> {
  return IsObject(value)
    && value.hasOwnProperty(UNIT_PRIVATE as symbol);
}


/** FUNCTIONS **/

export function IsValidUnit(unit: string): boolean {
  return (typeof unit === 'string')
    && (unit.trim() !== '')
    ;
}


export function ConvertUnitToOtherUnitValue<TFrom, TTo>(instance: IUnit<TFrom>, unit: string): TTo {
  return (instance.unit === unit)
    ? instance.value
    : GetTypeConverterOrThrow(instance.unit, unit)(instance.value);
}

export function ConvertUnitOrConstantToOtherUnitValue<T>(value: TUnitOrValue<T>, unit: string): T {
  return (value instanceof Unit)
    ? ConvertUnitToOtherUnitValue<T, T>(value, unit)
    : value as T;
}

/** METHODS **/

export function UnitGetValue<T>(instance: IUnit<T>): T {
  return (instance as IUnitInternal<T>)[UNIT_PRIVATE].value;
}

export function UnitGetUnit<T>(instance: IUnit<T>): string {
  return (instance as IUnitInternal<T>)[UNIT_PRIVATE].unit;
}

export function UnitTo<T, TTo>(instance: IUnit<T>, unit: string): IUnit<TTo> {
  return new Unit<TTo>(UnitToOptions(instance, unit));
}


export function UnitToOptions<T, TTo>(instance: IUnit<T>, unit: string): IUnitOptions<TTo> {
  if (IsValidUnit(unit)) {
    return {
      value: ConvertUnitToOtherUnitValue<T, TTo>(instance, unit),
      unit
    };
  } else {
    throw new TypeError(`Expected non empty string as unit`);
  }
}

export function UnitEquals<T>(instance: IUnit<T>, value: TUnitOrValue<T>): boolean {
  return ConvertUnitOrConstantToOtherUnitValue<T>(value, instance.unit) === instance.value;
}

/** CLASS **/

export class Unit<T> implements IUnit<T> {


  constructor(options: IUnitOptions<T>) {
    ConstructUnit<T>(this, options);
  }

  get value(): T {
    return UnitGetValue<T>(this);
  }

  get unit(): string {
    return UnitGetUnit<T>(this);
  }

  to<TTo>(unit: string): Unit<TTo> {
    return UnitTo<T, TTo>(this, unit);
  }

  toOptions<TTo>(unit: string): IUnitOptions<TTo> {
    return UnitToOptions<T, TTo>(this, unit);
  }

  equals(value: TUnitOrValue<T>): boolean {
    return UnitEquals<T>(this, value);
  }
}

