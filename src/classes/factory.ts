import { ToTuple, TupleConcat, TupleToIntersection } from './types';
import { SetInstanceOf } from './instanceof';

export interface Constructor<Instance = any, Args extends any[] = any[]> extends Function {
  new(...args: Args): Instance;
}

export interface AbstractClass<Instance = any> extends Function {
  prototype: Instance;
}

export type ClassType<Instance = any> = AbstractClass<Instance> | Constructor<Instance>;


export type TFactory = <TBase extends Constructor>(superClass: TBase) => TBase;

// exclude the constructor from T
export type ExcludeConstructor<T> = {
  [P in keyof T]: T[P] extends new(...args: any[]) => any ? never : T[P];
};

// removes all constructors of a tuple
export type ExcludeConstructors<T extends any[]> = {
  // [P in Extract<keyof T, number>]: ExcludeConstructor<T[P]>;
  [P in keyof T]: ExcludeConstructor<T[P]>;
};


// converts a tuple of constructor types (ex: [Constructor<A>, Constructor<B>]) to a tuple of instances types
export type InstancesTypes<T extends (new (...args: any[]) => any)[]> = {
  [P in keyof T]: T[P] extends new (...args: any[]) => infer R ? R : never;
  // [P in Extract<keyof T, number>]: T[P] extends new (...args: any[]) => infer R ? R : never;
};

// converts a tuple of constructor types (ex: [Constructor<A>, Constructor<B>]) to a tuple of their parameters
export type ConstructorsParameters<T extends (new (...args: any[]) => any)[]> = {
  [P in keyof T]: T[P] extends new (...args: infer P) => any ? P : never;
};


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

/**
 * Creates a new class from :
 *  - a base class
 *  - some other factories
 *  - a child class
 *  => child extends factories extends base
 * @param create
 * @param factories
 * @param superClass
 * @param options
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


/**
 * Returns true if class has the specified watermark
 * @param _class
 * @param waterMark
 * @param direct
 */
export function HasFactoryWaterMark(_class: (new(...args: any[]) => any), waterMark: symbol, direct: boolean = true): boolean {
  return (_class[waterMark] === true) && (direct ? _class.hasOwnProperty(waterMark) : true);
}


const IS_FACTORY_CLASS = Symbol('is-factory-class');

/**
 * Returns true if class has been build with MakeFactory
 * @param _class
 * @param direct
 */
export function IsFactoryClass(_class: (new(...args: any[]) => any), direct: boolean = true): boolean {
  return (_class[IS_FACTORY_CLASS] === true) && (direct ? _class.hasOwnProperty(IS_FACTORY_CLASS) : true);
}


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
 * @param args
 * @param superArgs
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

export interface IBaseClass {
}

export interface IBaseClassConstructor {
  new(): IBaseClass;
}

export class BaseClass {
}

/*------------------------------------*/

interface IA {
  a: string;
}

interface IAConstructor extends Function {
  new(a: string): IA;
}


interface IB {
  b: number;
}

interface IBConstructor extends Function {
  new(b: number): IB;
}


interface IC {
  c: null;
}

interface ICConstructor extends Function {
  new(c: null): IC;
}

function FactoryA<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IAConstructor, [], TBase>((superClass) => {
    return class A extends superClass implements IA {
      static staticA: string = 'static-a';
      a: string;

      constructor(...args: any[]) {
        const [a] = args[0];
        super(...args);
        this.a = a;
      }
    };
  }, [], superClass);
}


function FactoryB<TBase extends Constructor>(superClass: TBase) {
  return MakeFactory<IBConstructor, [], TBase>((superClass) => {
    return class B extends superClass implements IB {
      b: number;

      constructor(...args: any[]) {
        const [b] = args[0];
        super(...args.slice(1));
        this.b = b;
      }
    };
  }, [], superClass);
}


function FactoryC<TBase extends Constructor>(superClass: TBase) {
  function factory<TBase extends Constructor<IA>>(superClass: TBase) {
    return class C extends superClass {
      c: null;

      constructor(...args: any[]) {
        const [c] = args[0];
        super(...args.slice(1));
        this.c = c;
        console.log(this.a);
      }
    };
  }

  return MakeFactory<ICConstructor, [IAConstructor, IBConstructor], TBase>(factory, [FactoryA, FactoryB], superClass);
}


class D {
  d1: number;
  d2: string;

  constructor(d1: number, d2: string) {
    this.d1 = d1;
    this.d2 = d2;
  }
}


export function testFactoryV2() {
  const A = FactoryA(D);
  const C = FactoryC(D);

  const a = new A(['a'], 1, '2');
  console.log(a);

  const c = new C([null], ['a'], [2], 1, '2');
  console.log(c);
}

