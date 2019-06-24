const INSTANCE_OF_SYMBOL = Symbol('instanceof');

/**
 * Updates Symbol.hasInstance of source in such a way than 'destination' will become an instanceof 'source'
 * @param source
 * @param destination
 */
export function SetInstanceOf(source: Function, destination: Function): void {
  const hasInstance = (Symbol.hasInstance in source)
    ? source[Symbol.hasInstance].bind(source)
    : (() => false);

  Object.defineProperty(source, Symbol.hasInstance, {
    configurable: true,
    enumerable: false,
    writable: false,
    value: (instance: any) => {
      return (instance instanceof destination)
        || hasInstance(instance);
    }
  });

  if (!(INSTANCE_OF_SYMBOL in destination)) {
    Object.defineProperty(destination, INSTANCE_OF_SYMBOL, {
      value: new Set<Function>(),
    });
  }

  ((destination as any)[INSTANCE_OF_SYMBOL] as Set<Function>).add(source);
}

export function IsInstanceOf(instance: any, _class: Function): void {
  return (instance instanceof _class) || (
    (instance.constructor && (INSTANCE_OF_SYMBOL in instance.constructor))
      ? (instance.constructor as any)[INSTANCE_OF_SYMBOL].has(_class)
      : false
  );
}
