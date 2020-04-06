import { ConstructClassWithPrivateMembers } from '../misc/helpers/ClassWithPrivateMembers';
import { IsArray, IsObject } from '../helpers';
import { $this, CopyDescriptors, RegisterThis, SetConstructor, SetFunctionName } from './classes/helpers';
import { IInstance } from './classes/instance/interfaces';
import { Instance } from './classes/instance/implementation';
import { IsInstanceOf, SetInstanceOf } from '../classes/class-helpers/instanceof';
import { assert, assertFails } from '../classes/asserts';
import { Constructor } from '../classes/class-helpers/types';
import { IsIterable } from '../misc/helpers/iterators/is/is-iterable';

// export type TClassBuilderInstance<TConstructArgs extends any[], TProtoTypes extends object[]> = {
//   new ()
// }
//
// export type TClassBuilderClass<TConstructArgs extends any[], TProtoTypes extends object[]> = {
//   new ()
// }

// const a = TClassBuilderClass;

// export interface IClassBuilderOptions<TConstructArgs extends any[], TProtoTypes> {
//   name: string;
//   construct?: (...args: TConstructArgs) => void | object;
//   destruct?: () => void;
//   static?: object;
//   properties?: object;
//   extends?: object[];
// }

/**
 * Extracts the methods (keys) of a class
 */
// export type TPrototypeMethodKeys<TClass extends new (...args: any[]) => any> = Extract<{
//   [K in keyof InstanceType<TClass>]: IsType<InstanceType<TClass>[K], (...args: any) => any> extends true ? K : never;
// } extends { [key: string]: infer V } ? V : never, PropertyKey>;
//
// export type TPrototypeAttributeKeys<TClass extends new (...args: any[]) => any> = Extract<{
//   [K in keyof InstanceType<TClass>]: IsType<InstanceType<TClass>[K], (...args: any) => any> extends true ? never : K;
// } extends { [key: string]: infer V } ? V : never, PropertyKey>;
//
// export type TPrototype<TClass extends new (...args: any[]) => any> = {
//   [K in TPrototypeMethodKeys<TClass>]: InstanceType<TClass>[K] extends (...args: infer TArgs) => infer TReturn
//     ? (this: InstanceType<TClass>, ...args: TArgs) => TReturn
//     : never;
// } & {
//   [K in TPrototypeAttributeKeys<TClass>]?: InstanceType<TClass>[K];
// };


// /**
//  * Extracts property names of type 'method' keys from an object
//  */
// export type TObjectMethodKeys<T extends object> = Extract<{
//   [K in keyof T]: IsType<T[K], (...args: any) => any> extends true ? K : never;
// } extends { [key: string]: infer V } ? V : never, keyof T>;
//
// /**
//  * Extracts property names with a type different than 'method' from an object
//  */
// export type TObjectAttributeKeys<T extends object> = Extract<{
//   [K in keyof T]: IsType<T[K], (...args: any) => any> extends true ? never : K;
// } extends { [key: string]: infer V } ? V : never, keyof T>;
//
//
//
// /**
//  * Generates a Prototype template for ClassBuilder
//  */
// export type TPrototypeTemplate<TPrototype extends object> = {
//   [K in TObjectMethodKeys<TPrototype>]: TPrototype[K] extends (...args: infer TArgs) => infer TReturn
//     ? (this: TClassBuilderInstance<TPrototype>, ...args: TArgs) => TReturn
//     : never;
// } & {
//   [K in TObjectAttributeKeys<TPrototype>]?: TPrototype[K];
// };
//
//
// export type TClassBuilderStatic<TStatic extends object> = ExcludeConstructor<TStatic>;
// export type TClassBuilderInstance<TPrototype extends object> = TPrototype;
//
// export type TClassBuilderConstructor<TStatic extends object, TConstructArgs extends any[], TPrototype extends object> = TClassBuilderStatic<TStatic> & {
//   new(...args: TConstructArgs): TClassBuilderInstance<TPrototype>;
// };


/*----------------------------*/

export interface IClassBuilder {
  build(): Constructor;
}

export interface IClassBuilderConstructOptions {
  preInit?: (this: undefined, ...args: any[]) => any[]; // checking arguments, etc...
  supers?: (this: undefined, ...args: any[]) => any[]; // returns the list of arguments to provide to each supers
  init?: (this: object, ...args: any[]) => void | object;
}

export interface IClassBuilderOptions {
  name: string;
  construct?: IClassBuilderConstructOptions;
  // destruct?: () => void;
  static?: object;
  prototype?: object;
  extends?: IClassBuilder[];
}

export type IClassBuilderCreateContextThis = (_this: object) => object;
export type IClassBuilderCreateContextSuper = (_this: object, superClass: IClassBuilder) => IInstance<object, object>;

export interface IClassBuilderCreateContext {
  $this: IClassBuilderCreateContextThis;
  $super: IClassBuilderCreateContextSuper;
}

export type IClassBuilderCreate = (context: IClassBuilderCreateContext) => IClassBuilderOptions;


/*----------------------------*/

export const CLASS_BUILDER_PRIVATE = Symbol('class-constructor-private');

export interface IClassBuilderPrivate {
  name: string;
  static: object;
  prototype: object;
  extends: IClassBuilder[];

  preInit: (this: undefined, ...args: any[]) => any[];
  supers: (this: undefined, ...args: any[]) => any[];
  init: (this: object, ...args: any[]) => void | object;

  cookedStatic: object;
  cookedPrototype: object;
  classes: Function[];
}

export interface IClassBuilderInternal extends IClassBuilder {
  [CLASS_BUILDER_PRIVATE]: IClassBuilderPrivate;
}

export function ConstructClassBuilder(
  instance: IClassBuilder,
  create: IClassBuilderCreate,
): void {
  ConstructClassWithPrivateMembers(instance, CLASS_BUILDER_PRIVATE);
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  const $$this: IClassBuilderCreateContextThis = (_this: object): object => {
    _this = $this(_this);
    if (privates.classes.some(_class => IsInstanceOf(_this, _class))) {
      return _this;
    } else {
      throw new TypeError(`'this' is not an instance of '${ privates.name }'`)
    }
  };

  const $$super: IClassBuilderCreateContextSuper = (_this: object, superClass: IClassBuilder): IInstance<object, object> => {
    return new Instance($$this(_this), (superClass as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE].cookedPrototype);
  };

  const context: IClassBuilderCreateContext = {
    $this: $$this,
    $super: $$super
  };

  const options: IClassBuilderOptions = create(context);

  if (!IsObject(options)) {
    throw new TypeError(`Expected object as return of 'create'`);
  }
  let construct: IClassBuilderConstructOptions;

  if (options.construct === void 0) {
    construct = {};
  } else if (IsObject(options.construct)) {
    construct = options.construct;
  } else {
    throw new TypeError(`Expected object or void as options.construct`);
  }

  if (typeof options.name === 'string') {
    privates.name = options.name;
  } else {
    throw new TypeError(`Expected string as options.name`);
  }

  if (options.static === void 0) {
    privates.static = {};
  } else if (IsObject(options.static)) {
    privates.static = options.static;
  } else {
    throw new TypeError(`Expected object or void as options.static`);
  }
  // Object.freeze(privates.static);

  if (options.prototype === void 0) {
    privates.prototype = {};
  } else if (IsObject(options.prototype)) {
    privates.prototype = options.prototype;
  } else {
    throw new TypeError(`Expected object or void as options.prototype`);
  }
  // Object.freeze(privates.prototype);

  if (options.extends === void 0) {
    privates.extends = [];
  } else if (IsIterable(options.extends)) {
    privates.extends = Array.from(options.extends);
    if (privates.extends.some(superClass => !(superClass instanceof ClassBuilder))) {
      throw new TypeError(`Expected iterable of ClassBuilder as options.extends`);
    }
  } else {
    throw new TypeError(`Expected iterable or void as options.extends`);
  }


  if (construct.preInit === void 0) {
    privates.preInit = (...args) => args;
  } else if (typeof construct.preInit === 'function') {
    privates.preInit = construct.preInit;
  } else {
    throw new TypeError(`Expected function or void as options.construct.preInit`);
  }

  if (construct.supers === void 0) {
    if (privates.extends.length > 0) {
      throw new Error(`If options.extends is present and greater than 0, options.construct.supers must be provided`);
    } else {
      privates.supers = () => [];
    }
  } else if (typeof construct.supers === 'function') {
    privates.supers = construct.supers;
  } else {
    throw new TypeError(`Expected function or void as options.construct.supers`);
  }

  if (construct.init === void 0) {
    privates.init = () => {
    };
  } else if (typeof construct.init === 'function') {
    privates.init = construct.init;
  } else {
    throw new TypeError(`Expected function or void as options.construct.init`);
  }

  privates.cookedStatic = ClassBuilderBuildCookedStatic(instance, {});
  privates.cookedPrototype = ClassBuilderBuildCookedPrototype(instance, {});

  privates.classes = [];
}

export function IsClassBuilder(value: any): value is IClassBuilder {
  return IsObject(value)
    && value.hasOwnProperty(CLASS_BUILDER_PRIVATE as symbol);
}


/**
 * Merges all static members into target
 * @param instance
 * @param target
 */
export function ClassBuilderBuildStatic<T extends object>(instance: IClassBuilder, target: T): T {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    ClassBuilderBuildStatic<T>(privates.extends[i], target);
  }

  CopyDescriptors(privates.static, target, 'resolve');

  return target;
}

export function ClassBuilderBuildCookedStatic<T extends object>(instance: IClassBuilder, target: T): T {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    CopyDescriptors((privates.extends[i] as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE].cookedStatic, target, 'resolve');
  }

  CopyDescriptors(privates.static, target, 'resolve');

  return target;
}

export function ClassBuilderBuildPrototype<T extends object>(instance: IClassBuilder, target: T): T {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    ClassBuilderBuildPrototype<T>(privates.extends[i], target);
  }

  CopyDescriptors(privates.prototype, target, 'resolve');

  return target;
}

export function ClassBuilderBuildCookedPrototype<T extends object>(instance: IClassBuilder, target: T): T {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    CopyDescriptors((privates.extends[i] as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE].cookedPrototype, target, 'resolve');
  }

  CopyDescriptors(privates.prototype, target, 'resolve');

  return target;
}


export function ClassBuilderBuildConstructor(instance: IClassBuilder, _this: object, thisList: Set<any>, constructorArgs: any[]): object {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  RegisterThis(_this, thisList);

  const initArgs: any[] = privates.preInit.apply(void 0, constructorArgs);
  const superArgs: any[] = privates.supers.apply(void 0, initArgs);

  if (!IsArray(superArgs)) {
    throw new Error(`Expected array as options.construct.supers' return`);
  }

  if (superArgs.length !== privates.extends.length) {
    throw new Error(`Expected options.construct.supers' return length equal to options.extends.length`);
  }

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    _this = ClassBuilderBuildConstructor(privates.extends[i], _this, thisList, superArgs[i]);
  }

  const initResult: object | void = privates.init.apply(_this, initArgs);

  if (IsObject(initResult)) {
    _this = RegisterThis(initResult, thisList);
  } else if (initResult !== void 0) {
    throw new TypeError(`Expected object or void as options.construct.init's return`);
  }

  return _this;
}

export function ClassBuilderSetInstanceOf(instance: IClassBuilder, _class: Function): void {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  for (let i = 0, l = privates.classes.length; i < l; i++) {
    SetInstanceOf(privates.classes[i], _class);
  }

  for (let i = 0, l = privates.extends.length; i < l; i++) {
    ClassBuilderSetInstanceOf(privates.extends[i], _class);
  }
}



export function ClassBuilderBuild(instance: IClassBuilder): Constructor {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];

  const _class = function(this: object, ...args: any[]) {
    if (new.target === void 0) {
      throw new SyntaxError(`Must call class '${ privates.name  }' with new.`);
    }

    return ClassBuilderBuildConstructor(instance, this, new Set<object>(), args);
  };

  // set static
  CopyDescriptors(privates.cookedStatic, _class, 'resolve');

  // set name
  SetFunctionName(_class, privates.name);

  // elegant toString
  _class.toString = () => `class ${ privates.name } extends A, B, C {}`; // TODO


  // set prototype
  CopyDescriptors(privates.cookedPrototype, _class.prototype);
  SetConstructor(_class.prototype, _class);


  ClassBuilderSetInstanceOf(instance, _class);

  privates.classes.push(_class);

  return _class as any;
}

export function ClassBuilderIsInstanceOf(instance: IClassBuilder, superClass: IClassBuilder | Function): boolean {
  const privates: IClassBuilderPrivate = (instance as IClassBuilderInternal)[CLASS_BUILDER_PRIVATE];
  if (IsClassBuilder(superClass)) {
    return (superClass === instance)
      || privates.extends.some((_extend: IClassBuilder) => {
        return ClassBuilderIsInstanceOf(_extend, superClass);
      });
  } else {
    return privates.classes.includes(superClass)
      || privates.extends.some((_extend: IClassBuilder) => {
        return ClassBuilderIsInstanceOf(_extend, superClass);
      });
  }
}



export class ClassBuilder implements IClassBuilder {
  constructor(create: IClassBuilderCreate) {
    ConstructClassBuilder(this, create);
  }

  build(): Constructor {
    return ClassBuilderBuild(this);
  }

  isInstanceOf(superClass: IClassBuilder | Function): boolean {
    return ClassBuilderIsInstanceOf(this, superClass);
  }
}


/*----------------------------*/

export interface AStatic {
  a_static: string;
}

export interface AConstructor {
  new(a: string): A;
}

export interface APrototype {
  a_prop: string;
  a_method(arg: string): string;
}

export interface A extends APrototype {

}


export interface BConstructor {
  new(b: number): B;
}

export interface BPrototype {
  b_prop: number;
  b_method(arg: number): number;
}

export interface B extends BPrototype {
}


export interface CConstructor {
  new(c: number): C;
}

export interface CPrototype {
  c_prop: boolean;
  c_method(arg: boolean): boolean;
}

export interface C extends CPrototype {
}


const d = Symbol('d');
const e = Symbol('d');

export interface ZPrototype {
  a: string;
  method(arg: number): string;
  readonly b: string
  c?: string;
  [d]: () => void;
  [e]: boolean;
}

// const a: TPrototypeMethodKeys<AConstructor> = null;
// const b: TPrototypeAttributeKeys<AConstructor> = null;
// const c: TPrototype<AConstructor> = null;
// a[d] = 'ok';
// a.a = 1;
// const b: TPrototype<AConstructor>;

// TODO:
// - privates
// - supers
// - instanceof

// INFO : IDEA - every function receive { $this(), $private(), args }

export async function testClasses() {
  const _classA = new ClassBuilder(({ $this }) => {
    return {
      name: 'classA',
      static: {
        get a_static() {
          return 'a_static';
        }
      },
      construct: {
        preInit(a: string) {
          console.log('preInit A', arguments);
          return [a];
        },
        init(a: string) {
          console.log('construct A', arguments);
          ($this(this) as any).a_prop = a;
        },
      },
      prototype: {
        a_method(arg: string): string {
          return arg + '-' + ($this(this) as any).a_prop;
        },
        shared_method(): string {
          return 'a';
        },
      }
    };
  });

  const $classA: any = _classA.build();
  // const instanceA = new $classA('hello');
  //
  // console.log($classA);
  // console.log(instanceA);

  (window as any).$classA = $classA;


  const _classB = new ClassBuilder(({ $this, $super }) => {
    return {
      name: 'classB',
      static: {
        get b_static() {
          return 'b_static';
        }
      },
      construct: {
        supers() {
          console.log('super B');
          return [['value-from-b']];
        },
        init(b: number) {
          console.log('construct B', arguments);
          ($this(this) as any).b_prop = b;
        },
      },
      prototype: {
        b_method(arg: number): number {
          // $super(this, _classA).prop('a')
          return arg + ($this(this) as any).b_prop;
        },
        shared_method(): string {
          return 'b-' + $super(this, _classA).prop('shared_method')();
        },
      },
      extends: [
        _classA,
      ]
    };
  });

  // console.log(_classB);


  const $classB: any = _classB.build();
  const instanceB = new $classB(10);

  console.log($classB);
  console.log(instanceB);

  (window as any).$classB = $classB;
  (window as any).instanceB = instanceB;

  await assert(() => _classB.isInstanceOf(_classA));
  await assert(() => _classB.isInstanceOf($classA));
  await assert(() => (instanceB instanceof $classA));
  await assert(() => ($classB.b_static === 'b_static'));
  await assert(() => ($classB.a_static === 'a_static'));
  await assert(() => (instanceB.b_prop === 10));
  await assert(() => (instanceB.a_prop === 'value-from-b'));
  await assert(() => (instanceB.b_method(3) === 13));
  await assert(() => (instanceB.a_method('a-call') === 'a-call-value-from-b'));
  await assert(() => (instanceB.shared_method() === 'a-b'));
  await assertFails(() => instanceB.b_method.call(null, 3));

}
