import { LengthUnit } from '../implementation';

export class MeterUnit extends LengthUnit {
  constructor(value: number) {
    super({
      value,
      unit: 'meter'
    });
  }
}
