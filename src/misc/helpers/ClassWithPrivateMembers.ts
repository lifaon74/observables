export function ConstructClassWithPrivateMembers(instance: any, symbol: symbol): void {
  Object.defineProperty(instance, symbol, {
    value: {},
    configurable: false,
    writable: false,
    enumerable: false,
  });
}

export const PROTECTED = Symbol('protected');

export function ConstructClassWithProtectedMembers(instance: any): void {
  Object.defineProperty(instance, PROTECTED, {
    value: {},
    configurable: false,
    writable: false,
    enumerable: false,
  });
}
