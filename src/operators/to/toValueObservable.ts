import { IPromiseObservable } from '../../notifications/observables/complete-state/promise/promise-observable/interfaces';
import { IObservable, IObservableContext } from '../../core/observable/interfaces';
import { Pipe } from '../../core/observable-observer/implementation';
import { NotificationsObserver } from '../../notifications/core/notifications-observer/implementation';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { Observable } from '../../core/observable/public';

export function toValueObservable<T>(observable: IPromiseObservable<T>): IObservable<T> {
  return observable
    .on('error', (error: any) => {
      console.error('error', error);
    })
    .on('cancel', (reason: any) => {
      console.warn('cancel', reason);
    })
    .pipeThrough(
      new Pipe<
        INotificationsObserver<'complete', T>,
        IObservable<T>
      >(() => {
        let context: IObservableContext<T>;
        return {
          observer: new NotificationsObserver<'complete', T>('complete', (value: T) => {
            context.emit(value);
          }),
          observable: new Observable((_context: IObservableContext<T>) => {
            context = _context;
          })
        };
      })
    );
}
