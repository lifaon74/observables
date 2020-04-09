import { HandleError, TErrorStrategy } from './error-strategy';

export function CopyDescriptors<T extends object>(source: object, destination: T, conflictStrategy?: TErrorStrategy): T {
  Object.entries(Object.getOwnPropertyDescriptors(source)).forEach(([key, descriptor]) => {
    if (!destination.hasOwnProperty(key) || HandleError(new Error(`Property '${ key }' already exists`), conflictStrategy)) {
      Object.defineProperty(destination, key, descriptor);
    }
  });
  return destination;
}

export function SetConstructor<T extends object>(target: T, _constructor: Function): T {
  Object.defineProperty(target, 'constructor', {
    value: _constructor,
    writable: true,
    configurable: true,
    enumerable: false,
  });
  return target;
}

export function SetFunctionName<T extends Function>(target: T, name: string): T {
  Object.defineProperty(target, 'name', Object.assign(Object.getOwnPropertyDescriptor(target, 'name'), { value: name }));
  return target;
}

const thisMap: WeakMap<object, object> = new WeakMap<object, object>();

export function $this<T extends object = object>(_this: T): T {
  if (thisMap.has(_this)) {
    return thisMap.get(_this) as T;
  } else {
    throw new Error(`Invalid this`);
  }
}

export function RegisterThis<T extends object>(newThis: T, thisList: Set<T>): T {
  if (!thisList.has(newThis)) {
    thisList.add(newThis);
    for (const _this of Array.from(thisList)) {
      thisMap.set(_this, newThis);
    }
  }
  return newThis;
}


// const supersMap: WeakMap<object, WeakMap<Function, ISuper<any, any>>> = new WeakMap<object, WeakMap<Function, ISuper<any, any>>>();
//
// export function $super<TInstance extends object, TConstructor extends Function>(_this: TInstance, _constructor: TConstructor): ISuper<TInstance, TConstructor> {
//   if (!supersMap.has(_this)) {
//     supersMap.set(_this, new WeakMap<Function, ISuper<any, any>>());
//   }
//
//   const _supersMap: WeakMap<Function, ISuper<any, any>> = supersMap.get(_this) as WeakMap<Function, ISuper<any, any>> ;
//   if (!_supersMap.has(_constructor)) {
//     _supersMap.set(_constructor, new Super<TInstance, TConstructor>(_this, _constructor));
//   }
//
//   return _supersMap.get(_constructor) as ISuper<TInstance, TConstructor>;
// }
