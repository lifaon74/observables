import { IInstance } from './interfaces';
import { GetPropertyDescriptor } from '../../../classes/properties';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';

// <instance, Map<propName, function>
const propertiesFunctionMap: WeakMap<object, Map<string, Function>> = new WeakMap<object, Map<string, Function>>();

export function GetOrCreatePropertiesFunctionMap(instance: object): Map<string, Function> {
  if (propertiesFunctionMap.has(instance)) {
    return propertiesFunctionMap.get(instance) as Map<string, Function>;
  } else {
    const map: Map<string, Function> = new Map<string, Function>();
    propertiesFunctionMap.set(instance, map);
    return map;
  }
}

export function GetOrCreateInstanceFunctionProperty<T extends (...args: any[]) => any>(instance: object, propertyName: string, callback: T, functionsMap: Map<string, object> = GetOrCreatePropertiesFunctionMap(instance)): T {
  if (functionsMap.has(propertyName)) {
    return functionsMap.get(propertyName) as T;
  } else {
    const _callback = callback.bind(instance);
    functionsMap.set(propertyName, _callback);
    return _callback;
  }
}

/*----------------------------*/

export const INSTANCE_PRIVATE = Symbol('instance-private');

export interface IInstancePrivate<TInstance extends object, TPrototype extends object> {
  instance: TInstance;
  proto: TPrototype;
  functionsMap: Map<string, Function>;
}

export interface IInstanceInternal<TInstance extends object, TPrototype extends object> extends IInstance<TInstance, TPrototype> {
  [INSTANCE_PRIVATE]: IInstancePrivate<TInstance, TPrototype>;
}

export function ConstructInstance<TInstance extends object, TPrototype extends object>(
  instance: IInstance<TInstance, TPrototype>,
  _instance: TInstance,
  proto: TPrototype = instance.constructor as TPrototype,
): void {
  ConstructClassWithPrivateMembers(instance, INSTANCE_PRIVATE);
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  privates.instance = _instance;
  privates.proto = proto;
  privates.functionsMap = GetOrCreatePropertiesFunctionMap(privates.instance);
}

export function InstanceGetPropertyDescriptor<TInstance extends object, TPrototype extends object, T>(instance: IInstance<TInstance, TPrototype>, propertyName: string): PropertyDescriptor | null {
  return GetPropertyDescriptor((instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE].proto, propertyName);
}


export function InstanceProp<TInstance extends object, TPrototype extends object, T>(instance: IInstance<TInstance, TPrototype>, propertyName: string): T | undefined {
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if (descriptor === null) {
    return void 0;
  } else {
    if (typeof descriptor.get === 'function') {
      return descriptor.get.call(privates.instance);
    } else if (typeof descriptor.set === 'function') {
      throw new Error(`The property ${ propertyName } is a pure setter (not gettable)`);
    } else if (typeof descriptor.value === 'function') {
      return GetOrCreateInstanceFunctionProperty(privates.instance, propertyName, descriptor.value, privates.functionsMap) as T;
    } else {
      return descriptor.value;
    }
  }
}

export function InstanceAssign<TInstance extends object, TPrototype extends object>(instance: IInstance<TInstance, TPrototype>, propertyName: string, value: any): void {
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.set === 'function')) {
    return descriptor.set.call(privates.instance, value);
  } else {
    (privates.instance as any)[propertyName] = value;
  }
}

export function InstanceGet<TInstance extends object, TPrototype extends object, T>(instance: IInstance<TInstance, TPrototype>, propertyName: string): T {
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.get === 'function')) {
    return descriptor.get.call(privates.instance);
  } else {
    throw new Error(`The property ${ propertyName } is not a getter`);
  }
}

export function InstanceSet<TInstance extends object, TPrototype extends object>(instance: IInstance<TInstance, TPrototype>, propertyName: string, value: any): void {
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.set === 'function')) {
    return descriptor.set.call(privates.instance, value);
  } else {
    throw new Error(`The property ${ propertyName } is not a setter`);
  }
}


export function InstanceApply<TInstance extends object, TPrototype extends object, T>(instance: IInstance<TInstance, TPrototype>, propertyName: string, args: any[] = []): T {
  const privates: IInstancePrivate<TInstance, TPrototype> = (instance as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.value === 'function')) {
    return descriptor.value.apply(privates.instance, args);
  } else {
    throw new Error(`The property ${ propertyName } is not a function`);
  }
}


export class Instance<TInstance extends object, TPrototype extends object> implements IInstance<TInstance, TPrototype> {
  constructor(instance: TInstance, proto?: TPrototype) {
    ConstructInstance<TInstance, TPrototype>(this, instance, proto);
  }

  get instance(): TInstance {
    return ((this as unknown) as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE].instance;
  }

  get proto(): TPrototype {
    return ((this as unknown) as IInstanceInternal<TInstance, TPrototype>)[INSTANCE_PRIVATE].proto;
  }


  prop<T = any>(propertyName: string): T | undefined {
    return InstanceProp<TInstance, TPrototype, T>(this, propertyName);
  }

  assign(propertyName: string, value: any): void {
    return InstanceAssign<TInstance, TPrototype>(this, propertyName, value);
  }

  call<T = any>(propertyName: string, ...args: any[]): T {
    return this.apply(propertyName, args);
  }


  get<T = any>(propertyName: string): T {
    return InstanceGet<TInstance, TPrototype, T>(this, propertyName);
  }


  set(propertyName: string, value: any): void {
    return InstanceSet<TInstance, TPrototype>(this, propertyName, value);
  }


  apply<T = any>(propertyName: string, args?: any[]): T {
    return InstanceApply<TInstance, TPrototype, T>(this, propertyName, args);
  }
}
