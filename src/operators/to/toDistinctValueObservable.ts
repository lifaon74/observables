import { IPromiseObservable } from '../../notifications/observables/finite-state/built-in/promise/promise-observable/interfaces';
import { IObservable} from '../../core/observable/interfaces';
import { NotificationsObserver } from '../../notifications/core/notifications-observer/implementation';
import { INotificationsObserver } from '../../notifications/core/notifications-observer/interfaces';
import { Observable } from '../../core/observable/public';
import { IObservableContext } from '../../core/observable/context/interfaces';
import { Pipe } from '../../core/observable-observer/pipe/implementation';

export function toDistinctValueObservable<T>(observable: IPromiseObservable<T>): IObservable<T> {
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
