import { NumericUnit } from '../numeric/implementation';
import { INumericUnit } from '../numeric/interfaces';

/** SI **/

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

export function km(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'kilometer'
  });
}

/** IMPERIAL **/

export function inch(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'inch'
  });
}

export function foot(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'foot'
  });
}

export function mile(value: number): INumericUnit {
  return new NumericUnit({
    value,
    unit: 'mile'
  });
}
