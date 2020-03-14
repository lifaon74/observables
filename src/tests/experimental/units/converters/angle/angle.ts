import { RegisterMultiplierConverter, RegisterTypeAliases } from '../register';



export function GenerateDegreeToRadianUnitConverters(): void {
  RegisterMultiplierConverter('degree', 'radian', 180 / Math.PI);
}

export function GenerateDegreeAliases(): void {
  RegisterTypeAliases('degree', ['deg', '°']);
}


export function GenerateRadianAliases(): void {
  RegisterTypeAliases('radian', ['rad']);
}

export function GenerateAngleUnitConverters(): void {
  GenerateDegreeToRadianUnitConverters();
  GenerateDegreeAliases();
  GenerateRadianAliases();
}


