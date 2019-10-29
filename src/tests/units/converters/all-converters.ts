import { GenerateTimeUnitConverters } from './time/si';
import { GenerateLengthUnitConverters } from './length/all';


export function GenerateAllUnitConverters(): void {
  GenerateLengthUnitConverters();
  GenerateTimeUnitConverters();
}
