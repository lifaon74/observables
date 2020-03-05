import { NumericUnit } from './numeric/implementation';
import { INumericUnit } from './numeric/interfaces';

export function mm(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'millimeter'
  });
}

export function cm(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'centimeter'
  });
}

export function meter(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'meter'
  });
}
