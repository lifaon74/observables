import { TupleToIntersection } from './types';

export interface Constructor<Instance = any, Args extends any[] = any[]> extends Function {
  new(...args: Args): Instance;
}

export interface AbstractClass<Instance = any> extends Function {
  prototype: Instance;
}

export type ClassType<Instance = any> = AbstractClass<Instance> | Constructor<Instance>;


/**
 * Returns all descriptors following prototype inheritance for a target (must be a prototype)
 * @param target
 */
function * GetPropertyDescriptors(target: Object): IterableIterator<[any, PropertyDescriptor]> {
  const _keys: Set<any> = new Set<any>();

  while (target && (target !== Object.prototype)) {
    const keys: any[] = Object.getOwnPropertyNames(target).concat(Object.getOwnPropertySymbols(target) as any);
    for (const key of keys) {
      if (!_keys.has(key)) {
        yield [key, Object.getOwnPropertyDescriptor(target, key)];
        _keys.add(key);
      }
    }
    target = Object.getPrototypeOf(target);
  }
}

/**
 * Copies  deeply the prototype of 'source' into the prototype of 'destination'
 * @param source
 * @param destination
 */
function CopyPrototype(source: Function, destination: Function): void {
  const iterator: IterableIterator<[any, PropertyDescriptor]> = GetPropertyDescriptors(source.prototype);
  let result: IteratorResult<[any, PropertyDescriptor]>;
  while (!(result = iterator.next()).done) {
    if (result.value[0] !== 'constructor') {
      Object.defineProperty(destination.prototype, result.value[0], result.value[1]);
    }
  }
}

/**
 * Copies all own properties of 'source' into 'destination'
 * @param source
 * @param destination
 */
function CopyOwmProperties(source: Function, destination: Function): void {
  const keys: any[] = Object.getOwnPropertyNames(source).concat(Object.getOwnPropertySymbols(source) as any);
  for (const key of keys) {
    if (!(key in Function)) {
      Object.defineProperty(destination, key, Object.getOwnPropertyDescriptor(source, key));
    }
  }
}

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
    value: (instance: any) => {
      return (instance instanceof destination) || hasInstance(instance);
    }
  });

  if (!(INSTANCE_OF_SYMBOL in destination)) {
    Object.defineProperty(destination, INSTANCE_OF_SYMBOL, {
      value: new Set<Function>(),
    });
  }

  (destination as any)[INSTANCE_OF_SYMBOL].set(source);
}

export function IsInstanceOf(instance: Function, _class: Function): void {
  return (instance instanceof _class) || (
    (instance.constructor && (INSTANCE_OF_SYMBOL in instance.constructor))
      ? (instance.constructor as any)[INSTANCE_OF_SYMBOL].has(_class)
      : false
  );
}

/**
 * Makes 'destination' a copy of 'source' (and is instanceof source)
 * @param source
 * @param destination
 */
function CopyClass(source: Function, destination: Function) {
  CopyPrototype(source, destination);
  CopyOwmProperties(source, destination);
  SetInstanceOf(source, destination);
}

/**
 * Generates a descriptor where its value/get/set are bound to instance[key]
 * It means that the 'this' for instance[key] will be 'instance'
 * @param instance
 * @param key
 * @param descriptor
 */
function BindDescriptor(instance: any, key: any, descriptor: PropertyDescriptor): PropertyDescriptor {
  const _descriptor: PropertyDescriptor = {};
  _descriptor.configurable = descriptor.configurable;
  _descriptor.enumerable = descriptor.enumerable;

  if (typeof descriptor.value !== 'undefined') {
    let cachedFunction: Function;
    let cachedBoundFunction: Function;
    _descriptor.get = () => {
      if (typeof instance[key] === 'function') {
        if (cachedFunction !== instance[key]) {
          cachedFunction = instance[key];
          cachedBoundFunction = cachedFunction.bind(instance);
        }
        return cachedBoundFunction;
      } else {
        return instance[key];
      }
    };
    if (descriptor.writable) {
      _descriptor.set = (value: any) => {
        instance[key] = value;
      };
    }
  } else if (typeof descriptor.get === 'function') {
    _descriptor.get = descriptor.get.bind(instance);
  } else if (typeof descriptor.set === 'function') {
    _descriptor.set = descriptor.set.bind(instance);
  }
  return _descriptor;
}

export function SetClassName<TClass extends (new(...args: any[]) => any)>(_class: TClass, name: string): TClass {
  Object.defineProperty(_class, 'name', {
    configurable: true,
    enumerable: false,
    value: name,
    writable: false,
  });
  return _class;
}

/**
 * Tries to convert (does the best) a class to a class factory.
 * @param source
 */
export function ClassToFactory<TSource extends (new(...args: any[]) => any) = ObjectConstructor>(source: TSource) {
  return <TBase extends (new(...args: any[]) => any) = ObjectConstructor>(superClass: TBase = Object as any, mode: 'function' | 'class' | 'auto' = 'auto') => {
    let _class;
    if (superClass === Object as any) {
      _class = class extends (source as any) {
        constructor(args: any[]) {
          super(...args);
        }
      };
    } else {
      _class = class extends superClass {
        /*constructor(args: any[], ...superArgs: any[][]) {
          super(...superArgs);*/
        constructor(...args: any[]) {
          super(...args.slice(1));
          args = args[0];

          let _this: any;
          switch (mode) {
            case 'auto':
              try {
                // try to construct the class through a function call
                _this = (source as Function).apply(this, args);
                if (_this === void 0) {
                  _this = this;
                }
                mode = 'function';
              } catch (e) {
                // construct the class though Reflect
                _this = Reflect.construct(source, args);
                mode = 'class';
              }
              break;
            case 'function':
              _this = (source as Function).apply(this, args);
              if (_this === void 0) {
                _this = this;
              }
              break;
            case 'class':
              _this = Reflect.construct(source, args);
              break;
          }


          if (this !== _this) { // a super class may return a different this
            // (Mixin as any).registerThis(this, _this);

            // 1) reflect _this.constructor.prototype to this
            const iterator: IterableIterator<[any, PropertyDescriptor]> = GetPropertyDescriptors(Object.getPrototypeOf(_this));
            let result: IteratorResult<[any, PropertyDescriptor]>;
            while (!(result = iterator.next()).done) {
              const key: any = result.value[0];
              if (key !== 'constructor') {
                Object.defineProperty(this, key, BindDescriptor(_this, key, result.value[1]));
              }
            }

            // 2) reflect all own properties of _this to this
            const keys: any[] = Object.getOwnPropertyNames(_this).concat(Object.getOwnPropertySymbols(_this) as any);
            for (const key of keys) {
              if (key in this) {
                console.warn(`Crossing properties !`);
              }

              Object.defineProperty(this, key, BindDescriptor(_this, key, Object.getOwnPropertyDescriptor(_this, key)));
            }

            // prevents new properties to be added on _this
            Object.seal(_this);
          }
        }
      };

      CopyClass(source, _class);
    }

    SetClassName(_class, source.name);

    return _class as ExcludeConstructor<TSource & TBase> & {
      new(args: ConstructorParameters<TSource>, ...superArgs: ConstructorParameters<TBase>): (InstanceType<TSource> & InstanceType<TBase>);
    };
  };

}


// converts a tuple of construct types (ex: [Constructor<A>, Constructor<B>]) to a tuple of instances types
export type InstancesTypes<T extends (new (...args: any[]) => any)[]> = {
  [P in keyof T]: T[P] extends new (...args: any[]) => infer R ? R : never;
}

// converts a tuple of construct types (ex: [Constructor<A>, Constructor<B>]) to a tuple of their parameters
export type ConstructorsParameters<T extends (new (...args: any[]) => any)[]> = {
  [P in keyof T]: T[P] extends new (...args: infer P) => any ? P : never;
}

// exclude the constructor from T
export type ExcludeConstructor<T> = {
  [P in keyof T]: T[P] extends new(...args: any[]) => any ? never : T[P];
};

// excludes all constructors for the tuples
export type ExcludeConstructors<T extends any[]> = {
  [P in keyof T]: ExcludeConstructor<T[P]>;
};

// creates a class which is the intersection of many classes
export type TMixin<T extends (new (...args: any[]) => any)[]> = TupleToIntersection<ExcludeConstructors<T>> & {
  new(...args: ConstructorsParameters<T>): TupleToIntersection<InstancesTypes<T>>;
};

type TAbstractToConstructible<T extends Function> = T extends { prototype: infer P } ? new(...args: any[]) => P : never;

// function which creates a class extending another
type TClassFactory<TSource extends new(...args: any[]) => any> = <TBase extends new(...args: any[]) => any>(superClass: TBase) => TMixin<[TSource, TBase]>;


export type TFactoryClass<TClass extends (new(...args: any[]) => any), TArgs extends any[], TSuperClass extends (new(...args: any[]) => any) = TClass> =
  ExcludeConstructor<TClass>
  & {
  new(args: TArgs, ...superArgs: ConstructorParameters<TClass>): InstanceType<TClass>;
};


export function SetFactoryWaterMark<TClass extends (new(...args: any[]) => any)>(_class: TClass, waterMark: symbol): TClass {
  Object.defineProperty(_class, waterMark, {
    value: null,
  });
  return _class;
}

export function HasFactoryWaterMark(_class: (new(...args: any[]) => any), waterMark: symbol): boolean {
  return (waterMark in _class);
}

export function SetSuperArgsForFactoryClass(args: any[], superArgs: any[]): any[] {
  if (Array.isArray(args[0])) {
    args[0] = superArgs;
    return args;
  } else {
    throw new TypeError(`Expected array as argument 0`);
  }
}

export function SetSuperArgsForStandardClass(args: any[], superArgs: any[]): any[] {
  for (let i = 0, l = superArgs.length; i < l; i++) {
    args[i] = superArgs[i];
  }
  return args;
}

export function GetSetSuperArgsFunction(isFactoryClass: boolean): (args: any[], superArgs: any[]) => any[] {
  return isFactoryClass
    ? SetSuperArgsForFactoryClass
    : SetSuperArgsForStandardClass;
}


const IS_FACTORY_CLASS = Symbol('is-factory-class');

export function IsFactoryClass(_class: (new(...args: any[]) => any)): boolean {
  return (IS_FACTORY_CLASS in _class);
}

export function FactoryClass<TClass extends (new(...args: any[]) => any)>(_class: TClass) {
  return <TArgs extends any[]>(name: string, waterMark?: symbol) => {
    Object.defineProperty(_class, IS_FACTORY_CLASS, {
      value: null,
    });
    SetClassName(_class, name);
    if (waterMark !== void 0) {
      SetFactoryWaterMark(_class, waterMark);
    }
    return _class as TFactoryClass<TClass, TArgs>;
  };
}



