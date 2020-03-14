
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

export interface IUnit<T> extends IUnitOptions<T> {
  readonly value: T;
  readonly unit: string;

  /**
   * Converts an Unit to another Unit with 'unit'
   */
  to<TTo>(unit: string): IUnit<TTo>;

  /**
   * Converts an Unit to a IUnitOptions object with 'unit'
   */
  toOptions<TTo>(unit: string): IUnitOptions<TTo>;

  /**
   * Check if 'value' is equal to this Unit
   */
  equals(value: TUnitOrValue<T>): boolean;

  /**
   * Returns a string composed of the Unit's value and Unit's unit
   */
  toString(): string;
}
