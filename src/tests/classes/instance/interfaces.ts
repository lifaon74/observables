

export interface IInstance<TInstance extends object, TPrototype extends object> {
  readonly instance: TInstance;
  readonly proto: TPrototype;

  prop<T = any>(propertyName: string): T | undefined;

  /**
   * Assigns a value to the property bound to 'constructor'
   * @Example:
   *  - .prop('a') = 10  /!\ NOT POSSIBLE because only variable can be on the left side
   *  - .assign('a', 10) <==> super.a = 10
   */
  assign(propertyName: string, value: any): void;


  /**
   * Calls a method of the class
   * @Example:
   *  - .call('a', 10) <==> super.a(10) (!) only if 'a' is a function for 'super'
   */
  call<T = any>(propertyName: string, ...args: any[]): T;

  /**
   * Gets a "get" property of the class
   * @Example:
   *  - .get('a') <==> super.a (!) only if 'a' is a getter for 'super'
   */
  get<T = any>(propertyName: string): T;

  /**
   * Sets a "set" property of the class
   * @Example:
   *  - .set('a', 10) <==> super.a = 10 (!) only if 'a' is a setter for 'super'
   */
  set(propertyName: string, value: any): void;

  /**
   * Calls a method of the class
   * @Example:
   *  - .apply('a', [1, 2]) <==> super.a(1, 2) (!) only if 'a' is a function for 'super'
   */
  apply<T = any>(propertyName: string, args?: any[]): T;
}
