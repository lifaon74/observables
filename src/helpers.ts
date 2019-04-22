
export function noop() {}

export function EnumToString<T>(values: T[]): string {
  let string: string = '';
  for (let i = 0, l = values.length; i < l; i++) {
    if (i > 0) {
      string += (i === (l - 1)) ? ' or ' : ',';
    }
    string += `'${values[i]}'`;
  }
  return string;
}

export function MathClosestTo(targetValue: number, ...values: number[]): number {
  let closest: number = values[0];
  let closestDistance: number = Math.abs(values[0] - targetValue);

  let distance: number;
  for (let i = 1, l = values.length; i < l; i++) {
    distance = Math.abs(values[i] - targetValue);
    if (distance < closestDistance) {
      closest = values[i];
      closestDistance = distance;
    }
  }
  return closest;
}

export function IsObject(value: any): value is object {
  return (typeof value === 'object') && (value !== null);
}
