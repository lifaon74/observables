import { NumericUnit } from '../../numeric/implementation';
import { INumericUnitOptions } from '../../numeric/interfaces';

export class LengthUnit extends NumericUnit {
  constructor(options: INumericUnitOptions) {
    super(options);
  }
}
