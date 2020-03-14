import { INumericUnit } from '../numeric/interfaces';
import { NumericUnit } from '../numeric/implementation';


export function kelvin(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'kelvin'
  });
}

export function celcius(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'celcius'
  });
}


export function fahrenheit(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'fahrenheit'
  });
}
