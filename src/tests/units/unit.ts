// enum CSSNumericBaseType {
//   "length",
//   "angle",
//   "time",
//   "frequency",
//   "resolution",
//   "flex",
//   "percent",
// };

// dictionary CSSNumericType {
//   long length;
//   long angle;
//   long time;
//   long frequency;
//   long resolution;
//   long flex;
//   long percent;
//   CSSNumericBaseType percentHint;
// };
//
// [Exposed=(Window, Worker, PaintWorklet, LayoutWorklet)]
// interface CSSNumericValue : CSSStyleValue {
//   CSSNumericValue add(CSSNumberish... values);
//   CSSNumericValue sub(CSSNumberish... values);
//   CSSNumericValue mul(CSSNumberish... values);
//   CSSNumericValue div(CSSNumberish... values);
//   CSSNumericValue min(CSSNumberish... values);
//   CSSNumericValue max(CSSNumberish... values);
//
//   boolean equals(CSSNumberish... value);
//
//   CSSUnitValue to(USVString unit);
//   CSSMathSum toSum(USVString... units);
//   CSSNumericType type();
//
//   [Exposed=Window] static CSSNumericValue parse(USVString cssText);
// };


// unit is "number"
// Return «[ ]» (empty map)
//
// unit is "percent"
// Return «[ "percent" → 1 ]»
//
// unit is a <length> unit
// Return «[ "length" → 1 ]»
//
// unit is an <angle> unit
// Return «[ "angle" → 1 ]»
//
// unit is a <time> unit
// Return «[ "time" → 1 ]»
//
// unit is a <frequency> unit
// Return «[ "frequency" → 1 ]»
//
// unit is a <resolution> unit
// Return «[ "resolution" → 1 ]»
//
// unit is a <flex> unit
// Return «[ "flex" → 1 ]»
//
// anything else
// Return failure.

import { ReadonlyList } from '../../misc/readonly-list/implementation';
import { GenerateLengthUnitConverters } from './converters/converters';
import { GetTypeConverterOrThrow } from './converters/core';

export type TNumberLike = NumericValue | number;

export abstract class ValueNode {
  abstract reduce(): ValueNode;
}

export abstract class NumericValue extends ValueNode {
  // public readonly value: number;
  // public readonly type: number;

  protected constructor() {
    super();
  }

  abstract to(unit: string): Unit;
}


/*----------------*/

export type TMathOperationOperator =
  'addition'
  | 'subtraction'
  | 'product'
  | 'division'
  ;


export abstract class MathOperation extends NumericValue {
  public readonly operator: TMathOperationOperator;

  protected constructor(operator: TMathOperationOperator) {
    super();
    this.operator = operator;
  }
}

export abstract class Addition extends MathOperation {
  public readonly values: ReadonlyList<NumericValue>;

  protected constructor(values: NumericValue[]) {
    super('addition');
    this.values = new ReadonlyList<NumericValue>(values);
  }
}

/*----------------*/


export abstract class Unit extends NumericValue {
  public readonly value: number;
  public readonly unit: string;

  protected constructor(value: number, unit: string) {
    super();
    this.value = value;
    this.unit = unit;
  }

  reduce(): Unit {
    return this;
  }
}

// export abstract class LengthUnit extends Unit {
//   protected constructor() {
//
//   }
//   toSiUnit(): LengthUnit {
//     switch (this.unit) {
//
//     }
//   }
// }

export abstract class MilliMeterUnit extends Unit {
  public readonly value: number;

  protected constructor(value: number) {
    super(value, 'mm');
  }

  // to(unit: string): Unit {
  //   let universalUnit: number;
  //   switch (unit) {
  //
  //   }
  // }

  reduce(): Unit {
    return this;
  }
}

/*----------------*/

export interface IPCBItemOptions {
  x: Unit;
  y: Unit;
}

export abstract class PCBItem {
  public readonly x: Unit;
  public readonly y: Unit;

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
  GenerateLengthUnitConverters();

  // console.log(GetTypeConverterOrThrow('m', 'mm')(0.3));
  // console.log(GetTypeConverterOrThrow('m', 'cm')(0.3));
  // console.log(GetTypeConverterOrThrow('mm', 'cm', 0)(15));

  console.log(GetTypeConverterOrThrow('in', 'cm')(1));
  console.log(GetTypeConverterOrThrow('cm', 'in')(2.54 * 4));
  console.log(GetTypeConverterOrThrow('th', 'mm')(1));
}
