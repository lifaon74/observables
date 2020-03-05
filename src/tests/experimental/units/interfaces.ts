
/** INTERFACES & TYPES **/

export interface IUnitOptions<T> {
  value: T;
  unit: string;
}

export type TUnitOrValue<T> = IUnit<T> | T;

/** CLASS **/

export interface IUnitConstructor {
  new<T>(options: IUnitOptions<T>): IUnit<T>;
}

export interface IUnit<T> {
  readonly value: T;
  readonly unit: string;

  to<TTo>(unit: string): IUnit<TTo>;

  toOptions<TTo>(unit: string): IUnitOptions<TTo>;

  equals(value: TUnitOrValue<T>): boolean;
}
