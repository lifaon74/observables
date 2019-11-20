import { ClassToFactory, MakeFactory } from '../classes/class-helpers/factory';
import {
  Constructor, ConstructorsParameters, ExcludeConstructors, InstancesTypes
} from '../classes/class-helpers/types';
import { TupleToIntersection } from '../classes/types';
import {
  BindDescriptor,
  CopyClassStaticProperties, EXCLUDED_PROPERTY_NAMES, GetOwnPropertyKeys,
  GetPropertyDescriptors, GetSafePropertyDescriptors
} from '../classes/class-helpers/helpers';
import { SetInstanceOf } from '../classes/class-helpers/instanceof';

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


/*------------------------*/

export function testFactoryV2() {
  const A = FactoryA(D);
  const C = FactoryC(D);

  const a = new A(['a'], 1, '2');
  console.log(a);

  const c = new C([null], ['a'], [2], 1, '2');
  console.log(c);
}

/*------------------------*/


export function testFactory3() {
  const TextFactory = ClassToFactory(Text);
  const TextConstructor = TextFactory(D);
  const a = new TextConstructor(['a'], 1, '2');

  (window as any).TextConstructor = TextConstructor;
  (window as any).a = a;

}

/*------------------------*/

export type TMixinInstance<TClasses extends Constructor[]> = TupleToIntersection<InstancesTypes<TClasses>>;
export type TMixinStatic<TClasses extends Constructor[]> = TupleToIntersection<ExcludeConstructors<TClasses>>;
export type TMixinParameters<TClasses extends Constructor[]> = ConstructorsParameters<TClasses>;

export type TMixin<TClasses extends Constructor[]> =
  TMixinStatic<TClasses> & {
  new(...args: TMixinParameters<TClasses>): TMixinInstance<TClasses>;
};


function MixinReflectSourceClassIntoMixinClass(source: Constructor, destination: Constructor, mapInstance: ($this: object) => object): void {

  // copy source's static properties into destination's static properties
  const sourceStaticPropertiesIterator: Generator<[PropertyKey, PropertyDescriptor, Object]> = GetSafePropertyDescriptors(source);
  let sourceStaticPropertiesIteratorResult: IteratorResult<[PropertyKey, PropertyDescriptor, Object]>;
  while (!(sourceStaticPropertiesIteratorResult = sourceStaticPropertiesIterator.next()).done) {
    const [propertyName, descriptor] = sourceStaticPropertiesIteratorResult.value;
    Object.defineProperty(destination, propertyName, descriptor);
  }

  // copy source's prototype into destination's prototype
  const sourcePrototypeIterator: Generator<[PropertyKey, PropertyDescriptor, Object]> = GetSafePropertyDescriptors(source.prototype);
  let sourcePrototypeIteratorResult: IteratorResult<[PropertyKey, PropertyDescriptor, Object]>;
  while (!(sourcePrototypeIteratorResult = sourcePrototypeIterator.next()).done) {
    const [propertyName, descriptor] = sourcePrototypeIteratorResult.value;
    Object.defineProperty(destination.prototype, propertyName, BindDescriptor(mapInstance, propertyName, descriptor));
  }

  // set 'destination' as an instanceof of 'source'
  SetInstanceOf(source, destination);
}

function MixinConstructSourceClasses<TClasses extends Constructor<any>[]>(mixinThis: object, classes: TClasses, args: ConstructorsParameters<TClasses>): InstancesTypes<TClasses> {
  if (args.length !== classes.length) {
    throw new Error(`Expected ${ classes.length } arguments`);
  }

  const instances: InstancesTypes<TClasses> = classes.map((_class: Constructor, index: number) => Reflect.construct(_class, args[index])) as InstancesTypes<TClasses>;
  const instancesKeys: Set<PropertyKey>[] = instances.map((instance: object) => new Set<PropertyKey>(GetOwnPropertyKeys(instance)));

  // ensures than no key are shared
  for (let i = 1, l = instancesKeys.length; i < l; i++) {
    const keys: Set<PropertyKey> = instancesKeys[i];
    keys.forEach((key: PropertyKey) => {
      for (let j = 0; j < i; j++) {
        const keys: Set<PropertyKey> = instancesKeys[j];
        if (keys.has(key)) {
          throw new Error(`Class '${ classes[i].name }' and '${ classes[j].name }' shares a common key '${ String(key) }'`);
        }
      }
    });
  }

  // copy all instances into this
  const ownPropertyKeys: PropertyKey[] = [];
  for (let i = 0, l = instancesKeys.length; i < l; i++) {
    const instance: object = instances[i];
    const mapInstance = ($this: object) => {
      return ($this === mixinThis)
        ? instance
        : $this;
    };

    // copy instance into this
    const iterator: Iterator<PropertyKey> = instancesKeys[i].values();
    let result: IteratorResult<PropertyKey>;
    while (!(result = iterator.next()).done) {
      const key: PropertyKey = result.value;
      Object.defineProperty(mixinThis, key, BindDescriptor(mapInstance, key, Object.getOwnPropertyDescriptor(instance, key) as PropertyDescriptor));
      ownPropertyKeys.push(key);
    }
  }

  // copy all own properties into other instances
  for (let i = 0, li = instancesKeys.length; i < li; i++) {
    const instance: object = instances[i];
    const instanceKeys: Set<PropertyKey> = instancesKeys[i];

    const mapInstance = ($this: object) => {
      return ($this === instance)
        ? mixinThis
        : $this;
    };

    // copy this into instance
    for (let j = 0, lj = ownPropertyKeys.length; j < lj; j++) {
      const key: PropertyKey = ownPropertyKeys[j];
      if (!instanceKeys.has(key)) {
        Object.defineProperty(instance, key, BindDescriptor(mapInstance, key, Object.getOwnPropertyDescriptor(mixinThis, key) as PropertyDescriptor));
      }
    }

    Object.seal(instance);
  }

  return instances;
}

function Mixin<TClasses extends Constructor<any>[]>(...classes: TClasses): TMixin<TClasses> {

  const classesLength: number = classes.length;
  const $thisMap: WeakMap<object, InstancesTypes<TClasses>> = new WeakMap<object, InstancesTypes<TClasses>>();

  const mapInstance = ($this: object, index: number): object => {
    return $thisMap.has($this)
      ? ($thisMap.get($this) as Constructor[])[index]
      : $this;
  };

  const mixinClass = class {
    constructor(...args: ConstructorsParameters<TClasses>) {
      $thisMap.set(this, MixinConstructSourceClasses(this, classes, args));
    }
  };

  for (let i = 0; i < classesLength; i++) {
    MixinReflectSourceClassIntoMixinClass(classes[i], mixinClass, ($this: object) => {
      return mapInstance($this, i);
    });
  }

  return mixinClass as any;
}


class A implements IA {
  a: string;

  constructor(a: string) {
    this.a = a;
    // setInterval(() => {
    //   console.log(this);
    // }, 1000);
  }

  getA(): string {
    console.log(this);
    return this.a;
  }
}

class B implements IB {
  b: number;

  constructor(b: number) {
    this.b = b;
  }

  getB(): number {
    return this.b;
  }
}

/**
 * Problems:
 * - new C() is not an instance of Node
 */
class C extends Mixin(A, B, Text) {

}


export function testFactory() {
  const c = new C(['a'], [2], ['hello']);
  console.log(c);
  (window as any).c = c;
  // debugger;
}
