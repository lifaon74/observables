# How to listen to a temperature sensor

This example will show you how to create a simple Observable for a temperature sensor (WoT).

### WoT introduction 

The w3c is currently working on an API for the Web Of Things: https://w3c.github.io/wot-scripting-api/

We'll assume we already have a `thing` variable of type *[ConsumedThing](https://w3c.github.io/wot-scripting-api/#the-consumedthing-interface)*
(so the connection has been done before though  `wot.discover` for example).

This thing has one property `temperature` which is an Observable of type number, and two actions: `startMeasurement` and `stopMeasurement`,
to respectively start/stop reading the temperature.

We will create a function `temperatureObservable` which will take this thing as input and return an Observable
emitting the read temperatures and invoking automatically `startMeasurement` and `stopMeasurement` when necessary.


### 1) Basic implementation

```ts
function temperatureObservable(thing: ConsumedThing): IObservable<number> {
  let context: IObservableContext<number>; // first we need a reference to the returned Observable's context

  // we create an Observer observing the temperature
  const observer: IObserver<number> = thing['temperature']
    .pipeTo((value: number) => {
      context.emit(value);
    }); // not that we dont activate the Observer ! We'll do it only if at least one Observer is Observing the returned Observable.

  return new Observable<number>((_context: IObservableContext<number>) => {
    context = _context; // keep a reference to the context, to transfer values from 'observer' to this observable
    return {
      onObserved(): void {
        if (context.observable.observers.length === 1) {
          observer.activate();
          thing.actions['startMeasurement'].invoke({ units: 'Celsius' }); // invoke 'startMeasurement' when we have at lest one Observer
        }
      },
      onUnobserved(): void {
        if (!context.observable.observed) {
          observer.deactivate();
          thing.actions['stopMeasurement'].invoke(); // invoke 'stopMeasurement' when we have no more Observers
        }
      }
    }
  });
}
```

### 2) Implementation with Pipe (better)

```ts
function temperatureObservable(thing: ConsumedThing): IObservable<number> {
  return thing['temperature']
    .pipeThrough(Pipe.create<number, number>((context: IPipeContext<number, number>) => { // Pipe handle for us the activate/deactivate of the observer
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
```


### 3) Usage

```ts
const temperatureObserver = temperatureObservable(thing)
  .pipeTo((value: any) => {
    console.log('Temperature: ' + value);
  });

// toggle temperatureObserver button
document.querySelector('button').addEventListener('click', () => {
  if (temperatureObserver.activated) {
    temperatureObserver.deactivate();
  } else {
    temperatureObserver.activate();
  }
});
```

