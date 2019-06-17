/** TYPES **/

export type TNotificationName<N extends INotification<any, any>> = N extends INotification<infer TName, any> ? TName : never;
export type TNotificationValue<N extends INotification<any, any>> = N extends INotification<any, infer TValue> ? TValue : never;


/** INTERFACES **/

export interface INotificationConstructor {
  // converts an Event to a Notification
  fromEvent<TName extends string = string, TEvent extends Event = Event>(event: TEvent): INotification<TName, TEvent>;

  new<TName extends string, TValue>(name: TName, value: TValue): INotification<TName, TValue>;
}

/**
 * A notification is a tuple containing a name and a value.
 *  Its purpose its to associate a key with a value to allow filtering at the end of the pipe.
 *  @Example:
 *    const notification = new Notification<'click', Event>()
 */
export interface INotification<TName extends string, TValue> {
  readonly name: TName;
  readonly value: TValue;

  toJSON(): Pick<INotification<TName, TValue>, 'name' | 'value'>;
}
