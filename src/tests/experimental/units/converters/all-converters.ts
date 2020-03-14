import { GenerateTimeUnitConverters } from './time/si';
import { GenerateLengthUnitConverters } from './length/all';
import { GenerateAngleUnitConverters } from './angle/angle';
import { GenerateTemperatureUnitConverters } from './temperature/temperature';


export function GenerateAllUnitConverters(): void {
  GenerateLengthUnitConverters();
  GenerateTemperatureUnitConverters();
  GenerateTimeUnitConverters();
  GenerateAngleUnitConverters();
}
