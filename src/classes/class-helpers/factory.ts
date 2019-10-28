import { TupleConcat, TupleToIntersection } from '../types';
import { SetInstanceOf } from './instanceof';
import {
  AbstractClass,
  ClassType, Constructor, ConstructorsParameters, ExcludeConstructor, ExcludeConstructors, InstancesTypes
} from './types';
import { BaseClass } from './base-class';
import {
  BindDescriptorOld, CopyClass, EXCLUDED_PROPERTY_NAMES, GetOwnPropertyKeys, GetPropertyDescriptors,
  SetClassName
} from './helpers';


/***** TYPES *****/

// returns a tuple where types are the expected factories types
export type TMakeFactoryFactories<TSuperClasses extends (new (...args: any[]) => any)[]> = {
  [P in keyof TSuperClasses]: TSuperClasses[P] extends (new (...args: any[]) => infer R)
    ? (superClass: any) => new(/*ownArgs: any[], */...args: any[]) => R
    : never;
};


export type TMakeFactorySuperInstance<TSuperClasses extends Constructor[]> = TupleToIntersection<InstancesTypes<TSuperClasses>>;

export type TMakeFactoryInstance<TChildClass extends Constructor, TSuperClasses extends Constructor[], TBase extends Constructor> =
  InstanceType<TBase>
  & TMakeFactorySuperInstance<TSuperClasses>
  & InstanceType<TChildClass>;

export type TMakeFactorySuperStatic<TSuperClasses extends Constructor[]> = TupleToIntersection<ExcludeConstructors<TSuperClasses>>;

export type TMakeFactoryStatic<TChildClass extends Constructor, TSuperClasses extends Constructor[], TBase extends Constructor> =
  ExcludeConstructor<TBase>
  & TMakeFactorySuperStatic<TSuperClasses>
  & ExcludeConstructor<TChildClass>;

export type TMakeFactoryCreateSuperClass<TSuperClasses extends Constructor[]> =
  TSuperClasses extends []
    ? new(...args: any) => any
    : TMakeFactorySuperStatic<TSuperClasses> & {
      new(...args: any): TMakeFactorySuperInstance<TSuperClasses>;
    };

export type TMakeFactoryClass<TChildClass extends Constructor, TSuperClasses extends Constructor[], TBase extends Constructor> =
  TMakeFactoryStatic<TBase, TSuperClasses, TChildClass>
  & {
    new(ownArgs: ConstructorParameters<TChildClass>, ...args: TupleConcat<ConstructorsParameters<TSuperClasses>, ConstructorParameters<TBase>>): TMakeFactoryInstance<TChildClass, TSuperClasses, TBase>;
  };


export interface IMakeFactoryOptions {
  name?: string; // force a name for this class
  instanceOf?: ClassType; // force instanceof for this class
  waterMarks?: symbol[]; // uniq symbol to identify the class type
}

/***** MAKE *****/

/**
 * Creates a new class from :
 *  - a base class
 *  - some other factories
 *  - a child class
 *  => child extends factories extends base
 */
export function MakeFactory<TChildClass extends Constructor, TSuperClasses extends Constructor[], TBase extends Constructor>(
  create: (superClass: TMakeFactoryCreateSuperClass<TSuperClasses>) => TMakeFactoryCreateSuperClass<TSuperClasses>,
  factories: TMakeFactoryFactories<TSuperClasses>,
  superClass: TBase,
  options: IMakeFactoryOptions = {}
): TMakeFactoryClass<TChildClass, TSuperClasses, TBase> {
  let _superClass: any = superClass;
  for (let i = factories.length - 1; i >= 0; i--) {
    _superClass = factories[i](_superClass);
  }

  const _class: TMakeFactoryClass<TChildClass, TSuperClasses, TBase> = create(_superClass) as unknown as TMakeFactoryClass<TChildClass, TSuperClasses, TBase>;

  Object.defineProperty(_class, IS_FACTORY_CLASS, {
    value: true,
  });

  if (typeof options.name === 'string') {
    Object.defineProperty(_class, 'name', {
      configurable: true,
      enumerable: false,
      value: options.name,
      writable: false,
    });
  }

  if (Array.isArray(options.waterMarks)) {
    for (let i = 0, l = options.waterMarks.length; i < l; i++) {
      Object.defineProperty(_class, options.waterMarks[i], {
        value: true,
      });
    }
  }

  if (options.instanceOf !== void 0) {
    SetInstanceOf(options.instanceOf, _class);
  }

  return _class;
}


/***** MAKE FROM EXISTING CLASS *****/

/**
 * Tries to convert (does the best) a class to a class factory.
 */
export function ClassToFactory<TSource extends Constructor>(source: TSource) {
  return function<TBase extends Constructor>(superClass: TBase, mode: 'function' | 'class' | 'auto' = 'auto'): TMakeFactoryClass<TSource, [], TBase> {
    let _class;
    if (
      (superClass === (Object as any))
      || (superClass === (BaseClass as any))
    ) {
      _class = class extends (source as any) {
        constructor(args: any[]) {
          super(...args);
        }
      };
      SetInstanceOf(superClass, _class);
    } else {
      _class = class extends superClass {
        constructor(...args: any[]) {
          const ownArgs: ConstructorParameters<TSource> = args[0];
          super(...args.slice(1));

          let _this: any;
          switch (mode) {
            case 'auto':
              try {
                // try to construct the class through a function call
                _this = source.apply(this, ownArgs);
                if (_this === void 0) {
                  _this = this;
                }
                mode = 'function';
              } catch (e) {
                // construct the class though Reflect
                _this = Reflect.construct(source, ownArgs);
                mode = 'class';
              }
              break;
            case 'function':
              _this = source.apply(this, ownArgs);
              if (_this === void 0) {
                _this = this;
              }
              break;
            case 'class':
              _this = Reflect.construct(source, ownArgs);
              break;
          }


          if (this !== _this) { // a super class may return a different this
            // 1) reflect _this.constructor.prototype to this
            const iterator: IterableIterator<[PropertyKey, PropertyDescriptor, Object]> = GetPropertyDescriptors(Object.getPrototypeOf(_this));
            let result: IteratorResult<[PropertyKey, PropertyDescriptor, Object]>;
            while (!(result = iterator.next()).done) {
              const key: PropertyKey = result.value[0];
              if (!EXCLUDED_PROPERTY_NAMES.has(key)) {
                Object.defineProperty(this, key, BindDescriptorOld(_this, key, result.value[1]));
              }
            }

            // 2) reflect all own properties of _this to this
            const keys: PropertyKey[] = GetOwnPropertyKeys(_this);
            for (const key of keys) {
              if (!EXCLUDED_PROPERTY_NAMES.has(key)) {
                if (key in this) {
                  console.warn(`Crossing properties !`);
                }
                Object.defineProperty(this, key, BindDescriptorOld(_this, key, Object.getOwnPropertyDescriptor(_this, key) as PropertyDescriptor));
              }
            }

            // prevents new properties to be added on _this
            Object.seal(_this);
          }
        }
      };

      CopyClass(source, _class);
    }

    SetClassName(_class, source.name);

    return _class as any;
  };
}


/***** WATERMARK *****/

/**
 * Returns true if '_class' has the specified watermark
 */
export function HasFactoryWaterMark(_class: AbstractClass, waterMark: symbol, direct: boolean = true): boolean {
  return (_class[waterMark] === true) && (direct ? _class.hasOwnProperty(waterMark) : true);
}


const IS_FACTORY_CLASS = Symbol('is-factory-class');


/**
 * Returns true if '_class' has been build with MakeFactory
 */
export function IsFactoryClass(_class: AbstractClass, direct: boolean = true): boolean {
  return (_class[IS_FACTORY_CLASS] === true) && (direct ? _class.hasOwnProperty(IS_FACTORY_CLASS) : true);
}

/***** WATERMARK *****/

/**
 * Replace incoming args for the super class by superArgs in the context of a Factory class
 * @param args - list of remaining args from the constructor that should be passed to 'super'
 * @param superArgs - list of overloaded args to pass to the child
 */
export function SetSuperArgsForFactoryClass(args: any[], superArgs: any[]): any[] {
  if (Array.isArray(args[0])) {
    args[0] = superArgs;
    return args;
  } else {
    throw new TypeError(`Expected array as argument 0`);
  }
}

/**
 * Same as previous but class is a standard class instead
 */
export function SetSuperArgsForStandardClass(args: any[], superArgs: any[]): any[] {
  for (let i = 0, l = superArgs.length; i < l; i++) {
    args[i] = superArgs[i];
  }
  return args;
}

export type TSetSuperArgs = (args: any[], superArgs: any[]) => any[];

export function GetSetSuperArgsFunction(isFactoryClass: boolean): TSetSuperArgs {
  return isFactoryClass
    ? SetSuperArgsForFactoryClass
    : SetSuperArgsForStandardClass;
}

