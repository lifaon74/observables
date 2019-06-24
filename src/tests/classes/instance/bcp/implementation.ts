import { ConstructClassWithPrivateMembers } from '../../../misc/helpers/ClassWithPrivateMembers';
import { IInstance } from './interfaces';
import { GetPropertyDescriptor } from '../../../classes/properties';

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

export function GetOrCreateInstanceFunctionProperty<T extends (...args: any[]) => any>(instance: object, propertyName: string, callback: T, functionsMap: Map<string, Function> = GetOrCreatePropertiesFunctionMap(instance)): T {
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

export interface IInstancePrivate<TInstance extends object, TConstructor extends Function> {
  _instance: TInstance;
  _constructor: TConstructor;
  functionsMap: Map<string, Function>;
}

export interface IInstanceInternal<TInstance extends object, TConstructor extends Function> extends IInstance<TInstance, TConstructor> {
  [INSTANCE_PRIVATE]: IInstancePrivate<TInstance, TConstructor>;
}

export function ConstructInstance<TInstance extends object, TConstructor extends Function>(
  instance: IInstance<TInstance, TConstructor>,
  _instance: TInstance,
  _constructor: TConstructor = _instance.constructor as TConstructor,
): void {
  ConstructClassWithPrivateMembers(instance, INSTANCE_PRIVATE);
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  privates._instance = _instance;
  privates._constructor = _constructor;
  privates.functionsMap = GetOrCreatePropertiesFunctionMap(privates._instance);
}

export function InstanceGetPropertyDescriptor<TInstance extends object, TConstructor extends Function, T>(instance: IInstance<TInstance, TConstructor>, propertyName: string): PropertyDescriptor | null {
  return GetPropertyDescriptor((instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE]._constructor.prototype, propertyName);
}


export function InstanceProp<TInstance extends object, TConstructor extends Function, T>(instance: IInstance<TInstance, TConstructor>, propertyName: string): T | undefined {
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if (descriptor === null) {
    return void 0;
  } else {
    if (typeof descriptor.get === 'function') {
      return descriptor.get.call(privates._instance);
    } else if (typeof descriptor.set === 'function') {
      throw new Error(`The property ${ privates._constructor.name }.${ propertyName } is a pure setter (not gettable)`);
    } else if (typeof descriptor.value === 'function') {
      return GetOrCreateInstanceFunctionProperty(privates._instance, propertyName, descriptor.value, privates.functionsMap) as T;
    } else {
      return descriptor.value;
    }
  }
}

export function InstanceAssign<TInstance extends object, TConstructor extends Function>(instance: IInstance<TInstance, TConstructor>, propertyName: string, value: any): void {
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.set === 'function')) {
    return descriptor.set.call(privates._instance, value);
  } else {
    (privates._instance as any)[propertyName] = value;
  }
}

export function InstanceGet<TInstance extends object, TConstructor extends Function, T>(instance: IInstance<TInstance, TConstructor>, propertyName: string): T {
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.get === 'function')) {
    return descriptor.get.call(privates._instance);
  } else {
    throw new Error(`The property ${ privates._constructor.name }.${ propertyName } is not a getter`);
  }
}

export function InstanceSet<TInstance extends object, TConstructor extends Function>(instance: IInstance<TInstance, TConstructor>, propertyName: string, value: any): void {
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.set === 'function')) {
    return descriptor.set.call(privates._instance, value);
  } else {
    throw new Error(`The property ${ privates._constructor.name }.${ propertyName } is not a setter`);
  }
}


export function InstanceApply<TInstance extends object, TConstructor extends Function, T>(instance: IInstance<TInstance, TConstructor>, propertyName: string, args: any[] = []): T {
  const privates: IInstancePrivate<TInstance, TConstructor> = (instance as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE];
  const descriptor: PropertyDescriptor | null = InstanceGetPropertyDescriptor(instance, propertyName);
  if ((descriptor !== null) && (typeof descriptor.value === 'function')) {
    return descriptor.value.apply(privates._instance, args);
  } else {
    throw new Error(`The property ${ privates._constructor.name }.${ propertyName } is not a function`);
  }
}


export class Instance<TInstance extends object, TConstructor extends Function> implements IInstance<TInstance, TConstructor> {
  constructor(instance: TInstance, _constructor?: TConstructor) {
    ConstructInstance<TInstance, TConstructor>(this, instance, _constructor);
  }

  get instance(): TInstance {
    return ((this as unknown) as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE]._instance;
  }

  get instantiator(): TConstructor {
    return ((this as unknown) as IInstanceInternal<TInstance, TConstructor>)[INSTANCE_PRIVATE]._constructor;
  }


  prop<T = any>(propertyName: string): T | undefined {
    return InstanceProp<TInstance, TConstructor, T>(this, propertyName);
  }

  assign(propertyName: string, value: any): void {
    return InstanceAssign<TInstance, TConstructor>(this, propertyName, value);
  }

  call<T = any>(propertyName: string, ...args: any[]): T {
    return this.apply(propertyName, args);
  }


  get<T = any>(propertyName: string): T {
    return InstanceGet<TInstance, TConstructor, T>(this, propertyName);
  }


  set(propertyName: string, value: any): void {
    return InstanceSet<TInstance, TConstructor>(this, propertyName, value);
  }


  apply<T = any>(propertyName: string, args?: any[]): T {
    return InstanceApply<TInstance, TConstructor, T>(this, propertyName, args);
  }
}
