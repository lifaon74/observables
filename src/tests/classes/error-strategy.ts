export type TErrorStrategy = 'resolve' | 'warn' | 'throw';

export function HandleError(error: Error, strategy: TErrorStrategy = 'throw'): boolean {
  switch (strategy) {
    case 'resolve':
      return true;
    case 'warn':
      console.warn(error);
      return false;
    case 'throw':
      throw error;
    default:
      throw new TypeError(`Unexpected strategy: ${ strategy }`);
  }
}
