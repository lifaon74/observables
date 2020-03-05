import { GenerateSILengthUnitConverters } from './si';
import { GenerateImperialLengthUnitConverters } from './imperial';

export function GenerateLengthUnitConverters(): void {
  GenerateSILengthUnitConverters();
  GenerateImperialLengthUnitConverters();
}
