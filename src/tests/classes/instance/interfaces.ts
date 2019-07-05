export interface IInstance<TInstance extends object, TPrototype extends object> {
  readonly instance: TInstance;
  readonly proto: TPrototype;

  prop<T = any>(propertyName: string): T | undefined;

  /**
   * Assigns a value to the property bound to 'constructor'
   * @Example:
   *  - .prop('a') = 10  /!\ NOT POSSIBLE because only variable can be on the left side
   *  - .assign('a', 10) <==> super.a = 10
   * @param propertyName
   * @param value
   */
  assign(propertyName: string, value: any): void;


  /**
   * Calls a method of the class
   * @Example:
   *  - .call('a', 10) <==> super.a(10) (!) only if 'a' is a function for 'super'
   * @param propertyName
   * @param args
   * @returns {T}
   */
  call<T = any>(propertyName: string, ...args: any[]): T;

  /**
   * Gets a "get" property of the class
   * @Example:
   *  - .get('a') <==> super.a (!) only if 'a' is a getter for 'super'
   * @param propertyName
   * @returns {T}
   */
  get<T = any>(propertyName: string): T;

  /**
   * Sets a "set" property of the class
   * @Example:
   *  - .set('a', 10) <==> super.a = 10 (!) only if 'a' is a setter for 'super'
   * @param propertyName
   * @param value
   */
  set(propertyName: string, value: any): void;

  /**
   * Calls a method of the class
   * @Example:
   *  - .apply('a', [1, 2]) <==> super.a(1, 2) (!) only if 'a' is a function for 'super'
   * @param propertyName
   * @param args
   * @returns {T}
   */
  apply<T = any>(propertyName: string, args?: any[]): T;
}
