import { GenerateAllUnitConverters, GenerateLengthUnitConverters } from './converters/converters';
import { GetTypeConverterOrThrow, GetTypeConverters } from './converters/core';

// import { ReadonlySet } from '../../misc/readonly-set/implementation';

export interface IUnitOptions<T> {
  value: T;
  unit: string;
}

export type TUnitOrValue<T> = Unit<T> | T;

export function ConvertUnitToOtherUnitValue<TFrom, TTo>(instance: Unit<TFrom>, unit: string): TTo {
  return (instance.unit === unit)
    ? instance.value
    : GetTypeConverterOrThrow(instance.unit, unit)(instance.value);
}

export function ConvertUnitOrConstantToOtherUnitValue<T>(value: TUnitOrValue<T>, unit: string): T {
  return (value instanceof Unit)
    ? ConvertUnitToOtherUnitValue<T, T>(value, unit)
    : value;
}

export class Unit<T> {
  public readonly value: T;
  public readonly unit: string;

  constructor(options: IUnitOptions<T>) {
    this.value = options.value;
    this.unit = options.unit;
  }

  to<TTo>(unit: string): Unit<TTo> {
    return new Unit<TTo>({
      value: ConvertUnitToOtherUnitValue<T, TTo>(this, unit),
      unit
    });
  }

  equals(value: TUnitOrValue<T>): boolean {
    return ConvertUnitOrConstantToOtherUnitValue<T>(value, this.unit) === this.value;
  }
}

/*----*/

export type TNumericUnitOrValue = NumericUnit | number;

export function NumericUnitReduce(instance: NumericUnit, values: TNumericUnitOrValue[], reducer: (previousValue: number, currentValue: number) => number): number {
  return values.reduce((value: number, unit: TNumericUnitOrValue) => {
    return reducer(value, ConvertUnitOrConstantToOtherUnitValue<number>(unit, instance.unit));
  }, instance.value)
}

const add = (a: number, b: number) => (a + b);
const sub = (a: number, b: number) => (a - b);
const mul = (a: number, b: number) => (a * b);
const div = (a: number, b: number) => (a / b);

export class NumericUnit extends Unit<number> {
  constructor(options: IUnitOptions<number>) {
    super(options);
  }

  /** ARITHMETIC **/

  add(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, add),
      unit: this.unit,
    });
  }

  sub(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, sub),
      unit: this.unit,
    });
  }

  mul(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, mul),
      unit: this.unit,
    });
  }

  div(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, div),
      unit: this.unit,
    });
  }

  /** MATH **/

  min(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, Math.min),
      unit: this.unit,
    });
  }

  max(...values: TNumericUnitOrValue[]): NumericUnit {
    return new NumericUnit({
      value: NumericUnitReduce(this, values, Math.max),
      unit: this.unit,
    });
  }

}

function mm(value: number): NumericUnit {
  return new NumericUnit({
    value,
    unit: 'millimeter'
  });
}

function cm(value: number): NumericUnit {
  return new NumericUnit({
    value,
    unit: 'centimeter'
  });
}

function meter(value: number): NumericUnit {
  return new NumericUnit({
    value,
    unit: 'meter'
  });
}

// export class LengthUnit extends NumericUnit {
//   constructor(options: IUnitOptions<number>) {
//     super(options);
//   }
// }
//
// export class MeterUnit extends LengthUnit {
//   constructor(value: number) {
//     super({
//       value,
//       unit: 'm'
//     });
//   }
// }

/*----------------*/


export interface IPCBItemOptions {
  x: number;
  y: number;
}

export abstract class PCBItem {
  public readonly x: number;
  public readonly y: number;

  protected constructor(options: IPCBItemOptions) {
    this.x = options.x;
    this.y = options.y;
  }
}

export interface IPCBCopperOptions extends IPCBItemOptions {
  layer: number;
}

export class PCBCopper extends PCBItem {

  public readonly layer: number;

  constructor(options: IPCBCopperOptions) {
    super(options);
    this.layer = options.layer;
  }
}

export class PCBHole extends PCBItem {

  public readonly layer: number;

  constructor(options: IPCBCopperOptions) {
    super(options);
    this.layer = options.layer;
  }
}


/*----------------*/





export function testUnit() {
  GenerateAllUnitConverters();

  // console.log(GetTypeConverters('m', 'in'));
  // console.log(GetTypeConverterOrThrow('meter', 'metre')(0.3));
  // console.log(GetTypeConverterOrThrow('meter', 'm')(0.3));
  // console.log(GetTypeConverterOrThrow('m', 'cm')(0.3));
  // console.log(GetTypeConverterOrThrow('mm', 'cm')(15));
  //
  // console.log(GetTypeConverterOrThrow('in', 'cm')(1));
  // console.log(GetTypeConverterOrThrow('cm', 'in')(2.54 * 4));
  // console.log(GetTypeConverterOrThrow('th', 'mm')(1));
  // console.log(GetTypeConverterOrThrow('minute', 'second')(1));
  //
  // console.log(GetTypeConverterOrThrow('minute', 'meter')(1));


  console.log(meter(1).add(mm(1000)).sub(cm(10)).to('cm'));
}
