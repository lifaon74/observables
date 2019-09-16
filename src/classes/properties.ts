/**
 * Returns a descriptor following prototype inheritance for a target (must be a prototype)
 * @param target
 * @param propertyName
 */
export function GetPropertyDescriptor(target: Object, propertyName: string): PropertyDescriptor | null {
  while (target && (target !== Object.prototype)) {
    const descriptor: PropertyDescriptor | undefined = Object.getOwnPropertyDescriptor(target, propertyName);
    if (descriptor !== void 0) {
      return descriptor;
    }
    target = Object.getPrototypeOf(target);
  }
  return null;
}


// export type PropertyDescriptorType = 'property' | 'method';
//
// export interface NormalizedPropertyDescriptorResult<T> {
//   type: PropertyDescriptorType;
//   descriptor: TypedPropertyDescriptor<T>;
// }
//
// /**
//  * Detects if a descriptor is on a property or a method
//  * @param {Object} target
//  * @param {string} propertyKey
//  * @param {TypedPropertyDescriptor<T>} descriptor
//  * @return {NormalizedPropertyDescriptorResult<T>}
//  */
// export function NormalizePropertyDescriptor<T>(target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<T> | undefined): NormalizedPropertyDescriptorResult<T> {
//   if (descriptor === void 0) {
//     descriptor = Object.getOwnPropertyDescriptor(target, propertyKey);
//   }
//   if (descriptor === void 0) {
//     return {
//       type: 'property',
//       descriptor: {
//         configurable: true,
//         enumerable: true,
//         value: void 0,
//         writable: true,
//       },
//     };
//   } else {
//     return {
//       type: 'method',
//       descriptor: descriptor,
//     };
//   }
// }
//
// export interface IsIdenticalDescriptorCompareProperties {
//   configurable?: boolean;
//   enumerable?: boolean;
//   writable?: boolean;
//   value?: boolean;
//   set?: boolean;
//   get?: boolean;
// }
//
// export function IsIdenticalDescriptor<T>(descriptor_1: TypedPropertyDescriptor<T>, descriptor_2: TypedPropertyDescriptor<T>, properties: IsIdenticalDescriptorCompareProperties = {}): boolean {
//   properties.configurable = (properties.configurable === void 0) ? true : properties.configurable;
//   properties.enumerable = (properties.enumerable === void 0) ? true : properties.enumerable;
//   properties.writable = (properties.writable === void 0) ? true : properties.writable;
//   properties.value = (properties.value === void 0) ? true : properties.value;
//   properties.set = (properties.set === void 0) ? true : properties.set;
//   properties.get = (properties.get === void 0) ? true : properties.get;
//
//   if (properties.configurable) {
//     if (
//       ((descriptor_1.configurable === void 0) ? false : descriptor_1.configurable)
//       !==
//       ((descriptor_2.configurable === void 0) ? false : descriptor_2.configurable)
//     ) {
//       return false;
//     }
//   }
//
//   if (properties.enumerable) {
//     if (
//       ((descriptor_1.enumerable === void 0) ? false : descriptor_1.enumerable)
//       !==
//       ((descriptor_2.enumerable === void 0) ? false : descriptor_2.enumerable)
//     ) {
//       return false;
//     }
//   }
//
//   if (descriptor_1.hasOwnProperty('value')) { // 'value' descriptor
//     if (properties.writable) {
//       if (
//         ((descriptor_1.writable === void 0) ? false : descriptor_1.writable)
//         !==
//         ((descriptor_2.writable === void 0) ? false : descriptor_2.writable)
//       ) {
//         return false;
//       }
//     }
//
//     if (properties.value) {
//       if (!descriptor_2.hasOwnProperty('value')) {
//         return false;
//       }
//
//       if (descriptor_1.value !== descriptor_2.value) {
//         return false;
//       }
//     }
//   } else { // 'accessor' descriptor
//     if (properties.get) {
//       if (descriptor_1.hasOwnProperty('get')) {
//         if (!descriptor_2.hasOwnProperty('get')) {
//           return false;
//         }
//         if (descriptor_1.get !== descriptor_2.get) {
//           return false;
//         }
//       }
//     }
//
//     if (properties.set) {
//       if (descriptor_1.hasOwnProperty('set')) {
//         if (!descriptor_2.hasOwnProperty('set')) {
//           return false;
//         }
//         if (descriptor_1.set !== descriptor_2.set) {
//           return false;
//         }
//       }
//     }
//   }
//
//   return true;
// }
//
//
// export type PropertyOrMethodDecorator = <T>(target: Object, propertyKey: string | symbol, descriptor?: TypedPropertyDescriptor<T>) => TypedPropertyDescriptor<T> | void;
//
// export interface PropertyOrMethodDecoratorWrapperCallbackResult<T> {
//   descriptor: TypedPropertyDescriptor<T>;
//   compareProperties?: IsIdenticalDescriptorCompareProperties;
// }
//
// export type PropertyOrMethodDecoratorWrapperCallback = <T>(
//   target: Object,
//   propertyKey: string,
//   type: PropertyDescriptorType,
//   descriptor: Readonly<TypedPropertyDescriptor<T>>
// ) => PropertyOrMethodDecoratorWrapperCallbackResult<T>;
//
// export function PropertyOrMethodDecoratorWrapper(callback: PropertyOrMethodDecoratorWrapperCallback): PropertyOrMethodDecorator {
//   return <T>(target: Object, propertyKey: string, _descriptor?: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void => {
//     const { type, descriptor } = NormalizePropertyDescriptor<T>(target, propertyKey, _descriptor);
//     const result: PropertyOrMethodDecoratorWrapperCallbackResult<T> = callback<T>(target, propertyKey, type, Object.freeze(descriptor));
//     if (!IsIdenticalDescriptor(descriptor, result.descriptor, result.compareProperties)) {
//       if (type === 'property') {
//         Object.defineProperty(target, propertyKey, result.descriptor);
//       } else {
//         return result.descriptor as TypedPropertyDescriptor<T>;
//       }
//     }
//   };
// }
//
//
// export function PropertyCallInterceptor<T extends { [key: string]: any }, P extends string>(object: T, propertyName: P, callback: (args: Parameters<T[P]>, object: T, native: T[P]) => ReturnType<T[P]>): () => void {
//   const originalFunction: (...args: any[]) => any = (object as any)[propertyName];
//   (object as any)[propertyName] = function (...args: any[]) {
//     return callback.apply(this, [args, object, originalFunction]);
//   };
//
//   return () => {
//     (object as any)[propertyName] = originalFunction;
//   };
// }
