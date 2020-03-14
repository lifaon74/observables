import { GenerateAllUnitConverters } from './converters/all-converters';
import { cm, meter, mm } from './shortcuts/length';
import { INumericUnit, TNumericUnitOrValue } from './numeric/interfaces';
import { IsNumericUnit, NumericUnit } from './numeric/implementation';
import { IsUnit } from './implementation';
import { IUnit, IUnitOptions } from './interfaces';
import { GetTypeConverterOrThrow } from './converters/register';
import { fahrenheit, kelvin } from './shortcuts/temperature';

// import { ReadonlySet } from '../../misc/readonly-set/implementation';


/*----*/

/*----------------*/


export function NormalizeLengthUnit(value: TNumericUnitOrValue): INumericUnit {
  return IsNumericUnit(value)
    ? (
      (value.unit === 'meter')
        ? value
        : new NumericUnit(value.toOptions<number>('meter'))
    )
    : (
      IsUnit(value)
        ? new NumericUnit(
        (value.unit === 'meter')
          ? value
          : value.toOptions<number>('meter')
        )
        : new NumericUnit({
          value: value,
          unit: 'meter'
        })
    );
}

export function NormalizeLengthUnitToMeter(value: TNumericUnitOrValue): number {
  return IsUnit(value)
    ? (
      (value.unit === 'meter')
        ? value.value
        : value.toOptions<number>('meter').value
    )
    : value;
}

export interface IPCBItemOptions {
  x: TNumericUnitOrValue;
  y: TNumericUnitOrValue;
}

export interface IPCBItemRenderOptions {
  layer: number;
  layerColor: string;
}

export abstract class PCBItem {
  public readonly x: INumericUnit; // meter
  public readonly y: INumericUnit; // meter

  protected constructor(options: IPCBItemOptions) {
    this.x = NormalizeLengthUnit(options.x);
    this.y = NormalizeLengthUnit(options.y);
  }

  // abstract render(): void;
}

// export abstract class PCBItem {
//   public readonly x: number; // meter
//   public readonly y: number; // meter
//
//   protected constructor(options: IPCBItemOptions) {
//     this.x = NormalizeLengthUnitToMeter(options.x);
//     this.y = NormalizeLengthUnitToMeter(options.y);
//   }
// }


export interface IRectangle {
  width: INumericUnit;
  height: INumericUnit;
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


export class Shape2DPart {

}

export interface ILineToShape2DPartOptions {
  x: number; // x end position
  y: number; // y end position
}

export class LineTo extends Shape2DPart {
  public readonly x: number;
  public readonly y: number;

  constructor(options: ILineToShape2DPartOptions) {
    super();
    this.x = options.x;
    this.y = options.y;
  }

}

export interface IArcToShape2DPartOptions {
  x: number; // x center position
  y: number; // y center position
  angle: number;
}

export class ArcTo extends Shape2DPart {
  public readonly x: number;
  public readonly y: number;

  constructor(options: ILineToShape2DPartOptions) {
    super();
    this.x = options.x;
    this.y = options.y;
  }

}

/*--*/

export class Shape2D {

}



export class Area extends Shape2D {

}



export class Perimeter {

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

  // console.log(GetTypeConverterOrThrow('degree', 'radian')(180));
  // console.log(GetTypeConverterOrThrow('rad', 'deg')(Math.PI / 2));

  // console.log(GetTypeConverterOrThrow('celcius', 'kelvin')(0));
  // console.log(GetTypeConverterOrThrow('celcius', '°F')(0));

  // console.log(meter(1).add(mm(1000)).sub(cm(10)).to('cm').toString());
  console.log(NumericUnit.mean(fahrenheit(32), kelvin(273.15)).to('celcius').toString());
}
