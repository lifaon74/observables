
export interface Constructor<Instance = any, Args extends any[] = any[]> extends Function {
  new(...args: Args): Instance;
}

export interface HavingPrototype<Instance = any> {
  prototype: Instance;
}

export interface AbstractClass<Instance = any> extends Function, HavingPrototype {
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

