import { RegisterTypeAliases } from '../register';
import { GenerateSIUnitMultiplierConverters } from '../si';

/**
 * SI length uses 'meter' or 'metre'
 */
export function GenerateSILengthUnitConverters(): void {
  GenerateSIUnitMultiplierConverters('meter', 'm');
  RegisterTypeAliases('meter', ['metre']);
}
