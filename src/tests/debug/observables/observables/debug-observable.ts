import { INotificationsObservableContext } from '../../../../notifications/core/notifications-observable/context/interfaces';
import { NotificationsObservable } from '../../../../notifications/core/notifications-observable/public';

export async function debugObservableCyclicEmit() {
  type EventsMap = {
    'next': any;
    'complete': void;
  };
// syntax:
// (N)     - a position in the code
// => (N)  - go to N
// <= (N)  - return to N

  let context: INotificationsObservableContext<EventsMap>;
  const observable = new NotificationsObservable<EventsMap>((_context: INotificationsObservableContext<EventsMap>) => {
    context = _context;
    setTimeout(() => {
      context.dispatch('next', void 0); // => (1)
    }, 100);
  });

  observable
    .on('next', () => { // (1)
      // this function is called immediately after context.dispatch('next', void 0);
      console.log('next 1');
      context.dispatch('complete', void 0); // dispatch a 'complete' event => (2) INFO the 'next' for the observer2 has not been called yet !
      // (3)
      // <= (4)
    });

  observable
    .on('next', () => { // (4)
      console.log('next 2');
    })
    .on('complete', () => { // (2)
      // this function is called immediately after context.dispatch('complete', void 0);
      console.log('complete 2');
      // <= (3)
    });
}

export async function debugObservable() {
  debugObservableCyclicEmit();
}
