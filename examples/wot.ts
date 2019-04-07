/* JUST TS THINGS, PARTIAL TYPING */
import { INotificationsObservable } from '../src/notifications/core/notifications-observable/interfaces';
import { IObservable, IObservableContext } from '../src/core/observable/interfaces';
import { Observable } from '../src/core/observable/implementation';
import { Pipe } from '../src/core/observable-observer/implementation';
import { IObserver } from '../src/core/observer/interfaces';
import { IPipeContext } from '../src/core/observable-observer/interfaces';


interface WotDiscoverKVMap {
  'thing-description': string;
  'error': Error;
  'complete': void;
}

type WotConsumedThing = {
  id: string;
  name: string;
  base: string;
  actions: {
    [key: string]: WotThingAction
  };
} & {
  [key: string]: IObservable<any>
}

interface WotThingAction {
  invoke(inputValue?: any): Promise<any>;
}

interface Wot {
  discover(filter: any): INotificationsObservable<WotDiscoverKVMap>;
  consume(td: string): WotConsumedThing;
}

declare const wot: Wot;

/* ACTUAL CODE */

function example1() {
  const discoverObservable = wot.discover({ method: 'local' })
    .on('thing-description', (td: string) => {
      const thing = wot.consume(td);
      console.log('Thing ' + thing.name + ' has been consumed.');

      const temperatureObserver = thing['temperature']
        .pipeTo((value: any) => {
          console.log('Temperature: ' + value);
        }).activate();

      // toggle temperatureObserver button
      document.querySelector('button').addEventListener('click', () => {
        if (temperatureObserver.activated) {
          temperatureObserver.deactivate();
        } else {
          temperatureObserver.activate();
        }
      });

      thing.actions['startMeasurement'].invoke({ units: 'Celsius' })
        .then(() => {
          console.log('Temperature measurement started.');
        })
        .catch(() => {
          console.log('Error starting measurement.');
          temperatureObserver.deactivate();
        });
    })
    .on('error', (error: Error) => {
      console.log('Discovery error: ' + error.message);
    })
    .on('complete', () => {
      console.log('Discovery finished successfully');
      while (discoverObservable.observers.length > 0) { // clear the observers
        discoverObservable.observers.item(0).unobserve(discoverObservable);
      }
    })
  ;
}

function example2() {
  function temperatureObservable(thing: WotConsumedThing): IObservable<number> {
    let context: IObservableContext<number>;

    const observer: IObserver<number> = thing['temperature']
      .pipeTo((value: number) => {
        context.emit(value);
      });

    return new Observable<number>((_context: IObservableContext<number>) => {
      context = _context;
      return {
        onObserved(): void {
          if (context.observable.observers.length === 1) {
            observer.activate();
            thing.actions['startMeasurement'].invoke({ units: 'Celsius' });
          }
        },
        onUnobserved(): void {
          if (!context.observable.observed) {
            observer.deactivate();
            thing.actions['stopMeasurement'].invoke();
          }
        }
      }
    });
  }

  function temperatureObservableUsingPipe(thing: WotConsumedThing): IObservable<number> {
    return thing['temperature']
      .pipeThrough(Pipe.create<number, number>((context: IPipeContext<number, number>) => {
        return {
          onObserved(): void {
            if (context.pipe.observable.observers.length === 1) {
              thing.actions['startMeasurement'].invoke({ units: 'Celsius' });
            }
          },
          onUnobserved(): void {
            if (!context.pipe.observable.observed) {
              thing.actions['stopMeasurement'].invoke();
            }
          }
        };
      }));
  }
}

/** JS **/
// try {
//   let subscription = wot.discover({ method: "local" }).subscribe(
//     td => {
//       let thing = wot.consume(td);
//       console.log("Thing " + thing.name + " has been consumed.");
//       let subscription = thing["temperature"].subscribe(function(value) {
//         console.log("Temperature: " + value);
//       });
//       thing.actions["startMeasurement"].invoke({ units: "Celsius" })
//         .then(() => { console.log("Temperature measurement started."); })
//         .catch(e => {
//           console.log("Error starting measurement.");
//           subscription.unsubscribe();
//         })
//     },
//     error => { console.log("Discovery error: " + error.message); },
//     () => { console.log("Discovery finished successfully");}
//   );
// } catch(error) {
//   console.log("Error: " + error.message);
// }