import { GenerateAllUnitConverters } from './converters/all-converters';
import { cm, meter, mm } from './shortcuts';
import { INumericUnit, TNumericUnitOrValue } from './numeric/interfaces';
import { IsNumericUnit, NumericUnit } from './numeric/implementation';
import { IsUnit } from './implementation';
import { IUnit, IUnitOptions } from './interfaces';

// import { ReadonlySet } from '../../misc/readonly-set/implementation';


/*----*/




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
