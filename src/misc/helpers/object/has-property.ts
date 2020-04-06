/**
 * Returns true if 'target' has 'propertyKey' as own key
 */
export function HasOwnProperty(target: object, propertyKey: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(target, propertyKey);
}

export function HasProperty(target: object, propertyKey: PropertyKey): boolean {
  return (propertyKey in target);
}
