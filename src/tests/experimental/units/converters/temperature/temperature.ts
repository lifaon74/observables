import { RegisterAdditionConverter, RegisterCompleteTypeConverter, RegisterTypeAliases } from '../register';


export function GenerateKelvinToCelciusUnitConverters(): void {
  RegisterAdditionConverter('kelvin', 'celcius', 273.15);
}

export function GenerateKelvinToCentigradeUnitConverters(): void {
  RegisterAdditionConverter('kelvin', 'centigrade', 273.197);
}

export function GenerateKelvinToFahrenheitUnitConverters(): void {
  RegisterCompleteTypeConverter(
    'kelvin', 'fahrenheit',
    (input: number): number => (input * (9 / 5) - 459.67),
    (input: number): number => ((input + 459.67) * (5 / 9)),
  );
}


export function GenerateKelvinAliases(): void {
  RegisterTypeAliases('kelvin', ['K']);
}

export function GenerateCelciusAliases(): void {
  RegisterTypeAliases('celcius', ['°C']);
}

export function GenerateFahrenheitAliases(): void {
  RegisterTypeAliases('fahrenheit', ['°F']);
}

export function GenerateTemperatureUnitConverters(): void {
  GenerateKelvinToCelciusUnitConverters();
  GenerateKelvinToCentigradeUnitConverters();
  GenerateKelvinToFahrenheitUnitConverters();
  GenerateKelvinAliases();
  GenerateCelciusAliases();
  GenerateFahrenheitAliases();
}
