import { NumericUnit } from '../numeric/implementation';
import { INumericUnit } from '../numeric/interfaces';

export function rad(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'radian'
  });
}

export function deg(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'degree'
  });
}
