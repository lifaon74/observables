import { GenerateImperialLengthUnitConverters } from './imperial';
import { GenerateSILengthUnitConverters } from './si';
import { GenerateTimeUnitConverters } from './time';

export function GenerateLengthUnitConverters(): void {
  GenerateSILengthUnitConverters();
  GenerateImperialLengthUnitConverters();
}

export function GenerateAllUnitConverters(): void {
  GenerateLengthUnitConverters();
  GenerateTimeUnitConverters();
}
