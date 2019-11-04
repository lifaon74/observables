/** TYPES **/

export type TNotificationsObserverCallback<TValue> = (value: TValue) => void;

export interface INotificationsObserverLike<TName extends string, TValue> {
  name: TName;
  callback: TNotificationsObserverCallback<TValue>;
}
