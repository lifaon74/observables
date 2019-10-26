import { GenerateImperialLengthUnitConverters } from './imperial';
import { GenerateSILengthUnitConverters } from './si';

export function GenerateLengthUnitConverters(): void {
  GenerateSILengthUnitConverters();
  GenerateImperialLengthUnitConverters();
}
