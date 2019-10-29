[![npm (scoped)](https://img.shields.io/npm/v/@lifaon/observables.svg)](https://www.npmjs.com/package/@lifaon/observables)
![npm bundle size (scoped)](https://img.shields.io/bundlephobia/minzip/@lifaon/observables.svg)
![npm](https://img.shields.io/npm/dm/@lifaon/observables.svg)
![NPM](https://img.shields.io/npm/l/@lifaon/observables.svg)
![npm type definitions](https://img.shields.io/npm/types/@lifaon/observables.svg)


## Observables V2 ##
The repo tries to redefine the Observables: what are they ? what's their purpose ? how can we improve current RXJS Observables ?
This is unofficially related to the RXJS Observables and the [tc39 Observables proposal](https://github.com/tc39/proposal-observable).
I will try to define here a better definition and implementation of them from my point of view.

Before flaming, please give it a try 😉

To install:
```bash
yarn add @lifaon/observables
# or 
npm i @lifaon/observables --save
```

Entry point: `index.js`, others may contain some private or garbage experiment code. I recommend you to use rollup to import/bundle the package,
but you may use an already bundled version in `bundles/`.
The minified, gzipped, esnext version of <span style="color: #1062A4">**the core is less than 3KB !**</span>

You may also use unpkg: `https://unpkg.com/@lifaon/observables`

[SOME EXAMPLES HERE](./examples/README.md)

As comparision the rxjs core is: ![npm bundle size](https://img.shields.io/bundlephobia/minzip/rxjs.svg)
 (4 times bigger than this core), and the full bundle <span style="color: #1062A4">**27KB**</span>. Of course less operators are available in this project.
 
### Quick example: Observing Keyboard Events ###
Using the *Observable* constructor, we can create a function which returns an observable stream of events with a specific type for any EventTarget.
```ts
function listen<T extends Event>(target: EventTarget, name: string) {
 return new Observable<Event>((context: IObservableContext<Event>) => {
   const listener = (event: T) => context.emit(event);
   return {
     // everytime an Observer wants to receive data from this Observable, this method will be called
     onObserved() {
       if (context.observable.observers.length === 1) { // if its the first observer to observe this observable, create a listener
         target.addEventListener(name, listener);
       }
     },
     // everytime an Observer wants to stop to receive data from this Observable, this method will be called
     onUnobserved() {
       if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the listener.
         target.removeEventListener(name, listener);
       }
     }
   };
 });
}
```

Then we can observe this stream and log the pressed keys.

```ts
const observer = listen<KeyboardEvent>(target, 'keydown')
 .pipeTo(
   new Observer<KeyboardEvent>((value: KeyboardEvent) => {
     console.log(`Received key command: ${ value.key }`)
   })
 )
 .activate(); // by default, the observer is not activated, let's activated it
```
 
### Motivation ###

After using RXJS for a while (and a lot), I noticed some recurrent problems I faced:
- When subscribing to an Observable, you need to keep a reference to the Observable and to the Subscription,
in case you want to unsubscribe and subscribe many times. This is painful for streams you want to pause/resume frequently.
- RX.Observable are based on 3 states: *emitting*, *errored*, *complete*. Even if this cover most of the needs,
it is a little reductive for some special cases (ex: *aborted*, *cancelled*, *closed* ...).
- You can observe only one RX.Observable per subscription, else you need to create another RX.Observable with `merge`.

We can do better. That's why after many weeks of experimentation,
I came to another, more generic and more accurate definition of what is an Observable.
 
### Definitions ###

- **An Observable is a push source:**
It emits data with or without an observer consuming them. That's it.

- An Observable may be observed by one or many Observers (in RXJS it's called a Subscription).

- **An Observer is a push destination:**
It receives data without the need to pull them.

- An Observer may receives data from any source: from some Observables or by directly calling an `emit` function.

- An Observer may observes one or **many** Observables: it will directly receive data emitted by them.

- An Observer may be activated or deactivated (where RXJS only allow deactivation once though `.unsubscribe`).
A deactivated Observer stops receiving data from its Observables and can be reactivated later.

- When a Observer observes/unobserves an Observable, the Observable is notified and may start/stop some jobs.

- **An ObservableObserver is both an Observer and an Observable**.
It receives data from its observed Observables, and emits same or others data to its observing Observers.
Its nothing more than a tuple `{ observer, observable }`

- A **Pipe** is an ObservableObserver which automatically enters in an *activated* state if it has at least one Observer,
and leaves this state (enters *deactivated*) if no more Observers are observing it.


As an image, we may compare an Observable with a source (emits data),
an ObservableObserver with a pipe (transforms/transfers data)
and a Observer with a sink (receives and processes data).

To compare with RXJS, an Observer is both a RX.Observer and a RX.Subscription.

### Main differences between this spec and RXJS ###

**Here, Observables haven't any state: exit the *'complete'* and *'error'* state of the RXJS's Observables**
- Why ? Because for some "observables" (like timers, events or mqtt subscriptions), there is never a 'complete' or 'error' state. Just a stream a values which never end. 
- For "observables" with a final state (like promises or iterables), we may use a notifications system instead, emitting both
a value and its type (further explanations later). Moreover, it allows us to emit extra states if required (ex: 'aborted', 'pending', etc...)

**RXJS's Observer and a RXJS's Subscription are joined in one entity: Observer.**
- Only one reference (on the Observer) is required to subscribe/unsubscribe to the stream of data =>
  less variables for the user, easier return for the functions (one observer vs the tuple [observable, subscription])
- With an Observer we may subscribe/unsubscribe many times with the same object where the RXJS's Subscription is unique.

**RXJS promotes a lot its operators, where this spec try to limit their usage**
- The amount of RXJS's operators is extremely huge: it confuse new users and may discourage them.
- A pipe consumes a lot of CPU and memory usage: it requires to create underlying Observable and Observer (sophisticated classes and structures).
  Creating these objects consumes memory and forces data to pass though complex and longer code.
  For production environment with thousand if not millions of Observables and pipes, this is not optimal.
- Solution ? Use native code inside the functions receiving the values:
  - instead of `filter`, use `if`.
  - instead of `map`, transform the incoming value to a different one.
  - etc...

Most of the RXJS operators are just syntax sugar with important impact on the performance.
*it's an computationally inefficient manner to use the pipes*, where [cpu budget is a thing](https://www.google.com/search?q=js%20cpu%20budget) (ex: [The cost of javascript](https://medium.com/@addyosmani/the-cost-of-javascript-in-2018-7d8950fbb5d4)).

You may easily replace them with far faster native code in 99% of the cases:

```ts
// DONT
source
  .pipe(filter(num => num % 2 === 0)) // heck! you created a new Observable and Observer under the hood and a longer execution path for your data
  .subscribe(val => console.log(`Even number: ${val}`));

// DO
source
  .subscribe(val => {
    if (num % 2 === 0) {
      console.log(`Even number: ${val}`)
    }
  });
```

---

### A longer example: Ambient light sensor ###

Here's an example of an Observable based on the AmbientLightSensor

<details>
<summary>show</summary>
<p>

```ts
function sensorExample() {

  interface AmbientLightObservableEventsMap {
    'error': Error;
    'value': number;
  }

  /**
   * An Observable based on an AmbientLightSensor.
   * Emits the illuminance
   */
  class AmbientLightObservable extends NotificationsObservable<AmbientLightObservableEventsMap> {

    /**
     * Ensures permission is granted
     */
    static create(): Promise<AmbientLightObservable> {
      return navigator.permissions.query({ name: 'ambient-light-sensor' })
        .then((result: PermissionStatus) => {
          if (result.state === 'denied') {
            throw new Error(`Permission to use ambient light sensor is denied.`);
          } else {
            return new AmbientLightObservable();
          }
        });
    }

    constructor(options: { frequency: number } = { frequency: 10 }) {
      super((context: INotificationsObservableContext<AmbientLightObservableEventsMap>) => {
        // @ts-ignore - because AmbientLightSensor is draft
        const sensor: AmbientLightSensor = new AmbientLightSensor(options);

        const valueListener = () => context.dispatch('value', sensor.illuminance);
        // @ts-ignore - because SensorErrorEvent is draft
        const errorListener = (event: SensorErrorEvent) => context.dispatch('error', event.error);

        return {
          onObserved() {
            if (context.observable.observers.length === 1) {
              sensor.addEventListener('reading', valueListener);
              sensor.addEventListener('error', errorListener);
              sensor.start();
            }
          },
          onUnobserved() {
            if (!context.observable.observed) {
              sensor.removeEventListener('reading', valueListener);
              sensor.removeEventListener('error', errorListener);
              sensor.stop();
            }
          }
        };
      });
    }
  }

  return AmbientLightObservable.create()// or new AmbientLightObservable()
    .then((ambientLightObservable: AmbientLightObservable) => {

      // observes incoming values and log it in the DOM
      const ambientLightObserver = ambientLightObservable
        .addListener('value', (illuminance: number) => {
          const div = document.createElement('div');
          div.innerText = `${ illuminance }lux`;
          document.body.appendChild(div);
        });

      // observes errors and log it in the DOM if any
      ambientLightObservable
        .addListener('error', (error: Error) => {
          const div = document.createElement('div');
          div.innerText = `[ERROR]: ${ error.message }`;
          document.body.appendChild(div);
        }).activate();

      // creates a "toggle sensor" button
      const button = document.createElement('button');
      button.innerText = 'activate';
      button.style.margin = `10px`;
      document.body.appendChild(button);

      // on click, toggle ambientLightObserver
      button.addEventListener('click', () => {
        if (ambientLightObserver.activated) {
          button.innerText = 'activate';
          ambientLightObserver.deactivate();
        } else {
          button.innerText = 'deactivate';
          ambientLightObserver.activate();
        }
      });

      const div = document.createElement('div');
      div.innerText = `illuminance:`;
      document.body.appendChild(div);
    })
    .catch((error: any) => {
      const div = document.createElement('div');
      div.innerText = `[ERROR]: ${ error.message }`;
      document.body.appendChild(div);
    });
}
```

</p>
</details>

As you may see, its surprisingly simple to subscribe/unsubscribe by maintaining only one reference,
where RXJS requires to keep both the observable and the subscription.
```ts
button.addEventListener('click', () => {
  if (ambientLightObserver.activated) {
    button.innerText = 'activate';
    ambientLightObserver.deactivate();
  } else {
    button.innerText = 'deactivate';
    ambientLightObserver.activate();
  }
});
```

In the context of IoT and sensors, Observables may be extremely useful:
```ts
interface SmartElectricOutlet {
  state: Observable<'on' | 'off'>;
  current: Observable<number>;
  voltage: Observable<number>;  
  watts: Observable<number>;  
  wattHours: Observable<number>;
}
```

---

### Table of contents ###
<!-- toc -->
- [API](#api)
  * [Observable](#observable)
    + [Construct](#construct)
    + [pipeTo](#pipeto)
    + [pipeThrough](#pipethrough)
    + [pipe](#pipe)
    + [observedBy](#observedby)
    + [clearObservers](#clearobservers)
  * [Observer](#observer)
    + [Construct](#construct-1)
    + [emit](#emit)
    + [observe / unobserve](#observe--unobserve)
    + [disconnect](#disconnect)
    + [activate / deactivate](#activate--deactivate)
  * [ObservableObserver](#observableobserver)
  * [Pipe](#pipe)
    + [Construct](#construct-2)
    + [activate / deactivate](#activate--deactivate-1)
    + [create (static)](#create-static)
- [Helpers](#helpers)
  * [Notifications](#notifications)
    + [NotificationsObservable](#notificationsobservable)
      - [Construct](#construct-3)
      - [addListener](#addlistener)
      - [removeListener](#removelistener)
      - [on / off](#on--off)
      - [hasListener](#haslistener)
      - [matches](#matches)
    + [NotificationsObserver](#notificationsobserver)
  * [EventsObservable](#eventsobservable)
  * [FiniteStateObservable](#finitestateobservable)
  * [PromiseObservable](#promiseobservable)
    + [CancelToken](#canceltoken)
      - [of (static)](#of-static)
      - [cancel](#cancel)
      - [linkWithToken](#linkwithtoken)
      - [toAbortController / linkWithAbortController / linkWithAbortSignal](#toabortcontroller--linkwithabortcontroller--linkwithabortsignal)
      - [wrapPromise / wrapFunction / wrapFetchArguments](#wrappromise--wrapfunction--wrapfetcharguments)
    + [PromiseObservable](#promiseobservable-1)
    + [FetchObservable](#fetchobservable)




### API ###

Every methods and attributes are commented on the source files, in case you require more details.

#### Observable
```ts
interface IObservableConstructor {
  // creates an Observable
  new<T>(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
}

interface IObservable<T> {
  // list of observers observing this observable
  readonly observers: IReadonlyList<IObserver<T>>;
  // true if this Observable is observed
  readonly observed: boolean;

  // observes this Observable with "observer"
  pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, T>; // returns the observer

  // creates an Observable from "callback" and observes this Observable with it
  pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, T>; // returns the observer

  // observes this Observable with "observableObserver.observer" and return the Observable
  pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, T>; // returns the observer of the observableObserver

  // observes this Observable with "observableObserver.observer" and return the observableObserver
  pipe<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeResult<OO, T>; // returns the observableObserver

  // like "pipeTo" but returns this instead
  observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, T, this>; // returns this
  
  // detaches all the observers observing this observable
  clearObservers(): this;
}

type TObserverOrCallback<T> = IObserver<T> | ((value: T) => void);

// INFO: don't bother about the TObservablePipeToObserverResult, TObservablePipeToCallbackResult, etc...
// they're just there to ensure the Observer supports a superset of T
```

```ts
interface IObservableContext<T> {
  readonly observable: IObservable<T>;

  // emits 'value' to all the observers observing this observable
  emit(value: T): void;
}
```

```ts
interface IObservableHook<T> {
  // called when an Observer observes this Observable.
  onObserved?(observer: IObserver<T>): void;

  // called when an Observer stops observing this Observable.
  onUnobserved?(observer: IObserver<T>): void;
}
```


##### Construct
```ts
new<T>(create?: (context: IObservableContext<T>) => (IObservableHook<T> | void)): IObservable<T>;
```
When constructing an Observable, a callback may be provided, and is immediately called.
It will serve as a scoped context where you'll receive an ObservableContext to be able to emit data
and react to Observers observe/unobserve by returning an ObservableHook.

*Example:* An Observable which emits void data every 'period' milliseconds

```ts
function createTimerObservable(period: number) {
  return new Observable<void>((context: ObservableContext<any>) => {
    let timer: any | null = null;
    return {
      // called when an Observer observes this Observable
      onObserved(observer: Observer<any>) {
        if (timer === null) { // if its the first observer to observe this observable, create a timer
          timer = setInterval(() => {
            context.emit(); // emit void data
          }, period);
        }
      },
      // called when an Observer stops observing this Observable
      onUnobserved(observer: Observer<any>) {
        if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the timer.
          clearInterval(timer);
          timer = null;
        }
      }
    };
  });
}
```

**INFO:** You're strongly encouraged to start your work as soon as one Observer register.
And stop/clean when no more Observer is observing the Observable. You'll gain in global performance and CPU time optimization.

**AVOID:**
```ts
function createTimerObservable(period: number) {
  return new Observable<void>((context: ObservableContext<any>) => {
    setInterval(() => {
      context.emit(); // emit void data
    }, period);
  });
}
```


##### pipeTo
```ts
pipeTo<O extends IObserver<any>>(observer: O): TObservablePipeToObserverResult<O, T>; // returns this observer
pipeTo<C extends (value: any) => void>(callback: C): TObservablePipeToCallbackResult<C, T>; // returns an observer from callback
```
The piped Observer will observe the Observable. It is returned by the function.
It simply does `observer.observe(this)`.

The `pipeTo` method is an elegant wrapper to chain Observable and Observers.

*Example:*

```ts
observable
  .pipeTo(observer)
  .activate() // by default an Observer is in a 'deactivated' state, so activate it
```

**INFO:** Most of the methods of Observables and Observers return themself or the first argument passed to it.
This ensure simple and chainable calls.


##### pipeThrough
```ts
pipeThrough<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeThroughResult<OO, T>; // returns the observer of the observableObserver
```

This function is used to pipe an ObservableObserver.
It simply does :
```ts
this.pipeTo(observableObserver.observer);
return observableObserver.observable;
```

The `pipeThrough` method is an elegant wrapper to chain an ObservableObserver.

*Example:*

```ts
observable
  .pipeThrough({ observer: observer1, observable: observable1 })
  .pipeThrough(mapPipe)
  .pipeTo(observer)
  .activate()
```

More details on ObservableObserver bellow.

##### pipe
```ts
pipe<OO extends IObservableObserver<IObserver<any>, IObservable<any>>>(observableObserver: OO): TObservablePipeResult<OO, T>; // returns the observableObserver
```

This function is used to pipe an ObservableObserver just like `pipeThrough`.
It simply does :
```ts
this.pipeTo(observableObserver.observer);
return observableObserver;
```

*Example:*

```ts
observable
  .pipe({ observer: observer1, observable: observable1 }).observable
  .pipe(mapPipe).observable
  .pipeTo(observer)
  .activate()
```

More details on ObservableObserver bellow.


##### observedBy
```ts
observedBy<O extends TObserverOrCallback<any>[]>(...observers: O): TObservableObservedByResultNonCyclic<O, T, this>; // returns this
```
Asks all the *observers* to observe this Observable.

##### clearObservers
```ts
clearObservers(): this;
```
Detaches (*unobserve*) all the *observers* of this Observable.

Equivalent of:
```ts
// WARN: don't 'for loop' to removes observers !
// THIS IS WRONG:
for (let i = 0; i < observable.observers.length; i++) {
  observable.observers.item(i).unobserve(observable);
}

// if we remove the first observer, the observers' array is shifted on the left (second become first, etc...),
// so when index will be 1, it will actually target and remove the original third observer instead of the original second.
// the proper implementation requires simply to continuously remove the first element until the array is empty.

// INSTEAD DO:
while (observable.observers.length > 0) {
  observable.observers.item(0).unobserve(observable);
}

// Or at least, in a less efficient way, clone observable.observers before iterating over it:
const observers = Array.from(observable.observers);
for (let i = 0; i < observers.length; i++) {
  observers[i].unobserve(observable);
}
```
    
---


#### Observer
```ts
interface IObserverConstructor {
  // creates an Observer
  new<T>(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
}

interface IObserver<T> {
  // true if Observer is activated
  readonly activated: boolean;
  // list of Observables observed by this Observer
  readonly observables: IReadonlyList<IObservable<T>>;
  // true if Observer is observing at least one Observable
  readonly observing: boolean;

  // emit a value
  emit(value: T, observable?: IObservable<T>): void;

  // activates the Observer
  activate(): this;

  // deactivates the Observer
  deactivate(): this


  // observes a list of Observables
  observe<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this

  // stops observing a list of Observables
  unobserve<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this

  // stops observing all its Observables
  disconnect(): this;
}
```

##### Construct
```ts
new<T>(onEmit: (value: T, observable?: IObservable<T>) => void): IObserver<T>;
```
An Observer takes one argument: the callback to receive and process the data.

*Example:* Listening to our previous "timer-observable"

```ts
const observer = createTimerObservable(1000)
  .pipeTo(new Observer<void>(() => {
    console.log('updated');
  })).activate();
```


##### emit
```ts
emit(value: T, observable?: IObservable<T>): void;
```
This is the data's entry point of the Observer.
Calling this function will call the `onEmit` function provided in the constructor if the Observer is activated.

*Example:* Sending data to an Observer
```ts
const observer = new Observer<number>((value: number) => {
   console.log(value);
}).activate();

// print 0, 1, 2, 3, ..., 9
for (let i = 0; i < 10; i++) {
  observer.emit(i); 
}
```


##### observe / unobserve
```ts
readonly observables: IReadonlyList<IObservable<T>>;
readonly observing: boolean;

observe<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this
unobserve<O extends IObservable<any>[]>(...observables: O): TObserverObserveResultNonCyclic<O, T, this>; // returns this
```

`observe` appends `observables` to the list of this Observer's observables.
`unobserve` removes `observables` from the list of this Observer's observables.
More explanations with *activate/deactivate*.

##### disconnect
```ts
disconnect(): this;
```
Stops observing all the observables from the list of this Observer's observables.




##### activate / deactivate
```ts
readonly activated: boolean;

activate(): this;
deactivate(): this
```
An Observer is by default in a **deactivated** state. It means it won't receive any data from its Observables.
To observe/unobserve the *data flow*, simply call `activate()` or `deactivate()`. 

*Example:* Observing our previous "timer-observable"

```ts
const observer = new Observer<void>(() => {
  console.log('updated');
})
.observe(createTimerObservable(1000))
.activate();
```

Understanding the difference between `observe/unobserve` and `activate/deactivate`:
- `observe/unobserve`: appends/removes Observables. It doesn't link/unlink except if activated/deactivated.
- `activate/deactivate`: activate/deactivate data flow.

When an Observer is activated, it *subscribe* to all of its Observables and notify them though `onObserved`.
When an Observer is deactivated, it *unsubscribe* to all of its Observables and notify them though `onUnobserved`.

*Example:* until activated observer.observables != observable.observers

```ts
const observable = createTimerObservable(1000);

const observer = new Observer<void>(() => {
  console.log('updated');
});

observer.observe(observable);

// because 'observer' is not activated, 'observable' didn't received an 'onObserved'
// -> observable.observers is an empty array => []
// -> observer.observables is an array with just 'observable' inside => [observable]

assert(!observable.observers.includes(observer));

observer.activate();

// 'observable' received an 'onObserved', and added 'observer' to its list of observers
// -> observable.observers is now an array with just 'observer' inside => [observer]

assert(observable.observers.includes(observer));
```

---


#### ObservableObserver
```ts
interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>>  {
  readonly observer: TObserver;
  readonly observable: TObservable;
}
```

An ObservableObserver is simply a tuple containing an Observer and an Observable.
It's not a class, it's only an interface.

*Example:* a map function which transforms incoming data

```ts
function map<Tin, Tout>(transform: (value: Tin) => Tout): IObservableObserver<IObserver<Tin>, IObservable<Tout>> {
  let context: IObservableContext<Tout>;
  return {
    observer: new Observer((value: Tin) => {
      context.emit(transform(value));
    }),
    observable: new Observable((_context: IObservableContext<Tout>) => {
      context = _context;
    })
  }
}
```
**INFO**: Do not use this code as it doesnt self activate/deactivate ! For this, use Pipes.

#### Pipe
```ts
interface IPipeConstructor {
  create<TValueObserver, TValueObservable = TValueObserver>(
    create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
  ): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  // creates a Pipe
  new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(create: () => IObservableObserver<TObserver, TObservable>): IPipe<TObserver, TObservable>;
}

interface IPipe<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableObserver<TObserver, TObservable>  {
  readonly activateMode: TObservableObserverActivateMode;
  readonly deactivateMode: TObservableObserverActivateMode;
  readonly activated: boolean;

  activate(mode?: TObservableObserverActivateMode): this;
  deactivate(mode?: TObservableObserverActivateMode): this;
}

type TObservableObserverActivateMode = 'auto' | 'manual';
```

```ts
interface IPipeContext<TObserver extends IObserver<any>, TObservable extends IObservable<any>> {
  readonly pipe: IPipe<TObserver, TObservable>;

  emit(value: ObservableType<TObservable>): void;
}

interface IPipeHook<TObserver extends IObserver<any>, TObservable extends IObservable<any>> extends IObservableHook<ObservableType<TObservable>> {
  // called when this Observer receives data.
  onEmit?(value: ObserverType<TObserver>, observable?: TObservable): void;
}
```

A Pipe is an helper of type ObservableObserver which self activate/deactivate.

##### Construct
```ts
new<TObserver extends IObserver<any>, TObservable extends IObservable<any>>(create: () => IObservableObserver<TObserver, TObservable>): IPipe<TObserver, TObservable>;
```
A Pipe takes a "context" callback called immediately, which returns an ObservableObserver.

*Example:* a map function which transforms incoming data

```ts
function map<Tin, Tout>(transform: (value: Tin) => Tout): IPipe<IObserver<Tin>, IObservable<Tout>> {
  let context: IObservableContext<Tout>;
  return new Pipe(() => {
    let context: IObservableContext<Tout>;
    return {
      observer: new Observer((value: Tin) => {
        context.emit(transform(value));
      }),
      observable: new Observable((_context: IObservableContext<Tout>) => {
        context = _context;
      })
    };
  });
}
```

As opposite to the previous example (map with ObservableObserver), the pipe self activate when it has at least one observer
and self deactivate when it is no more observed.

##### activate / deactivate
```ts
readonly activateMode: TObservableObserverActivateMode;
readonly deactivateMode: TObservableObserverActivateMode;
readonly activated: boolean;

activate(mode?: TObservableObserverActivateMode): this;
deactivate(mode?: TObservableObserverActivateMode): this;
```

By default a Pipe self activates if at least one observer observes it,
and self deactivates when no one observes it.

Calling `activate`:
 - with *'manual'* mode: forces the observer to *activate* and will disable self deactivation.
 - with *'auto'* mode: enable self activation (will immediately self activate if observed).

Calling `deactivate`:
 - with *'manual'* mode: forces the observer to *deactivate* and will disable self activation.
 - with *'auto'* mode: enable self deactivation (will immediately self deactivate if not observed).
 
**INFO:** You should probably not manually activate/deactivate a Pipe except if you know exactly what you're doing.
The self activation/deactivation allows a better CPU usage and freeing of resources.


##### create (static)
```ts
create<TValueObserver, TValueObservable = TValueObserver>(
  create?: (context: IPipeContext<IObserver<TValueObserver>, IObservable<TValueObservable>>) => (IPipeHook<IObserver<TValueObserver>, IObservable<TValueObservable>> | void)
): IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;
```

For Pipes using only Observable and Observer you may use `Pipe.create`.
The callback is really similar to the one for an Observable, except it includes an `onEmit?(value: TValueObserver): void;`
function which receives the observed data.

*Example:* a map function which transforms incoming data into number

```ts
// create a map pipe which transform incoming data into numbers
const pipe = Pipe.create<any, number>((context) => {
  return {
    onEmit(value: any) {
      context.emit(Number(value));
    }
  };
});

// create a simple pipe to emit some data
const emitter = Pipe.create<any>();

emitter.observable
  .pipeThrough(pipe)
  .pipeTo((value: number) => {
    console.log(value);
  }).activate();

emitter.observer.emit(false); // 0
emitter.observer.emit(1); // 1
emitter.observer.emit('2'); // 2
emitter.observer.emit(void 0); // NaN
```


---

---


### Helpers

Helpers are not part of the core implementation but provides extremely useful functionalities.

#### Notifications
Notifications (also called *events* sometimes) are one frequent and common usage of the streams:
- RXJS with its *complete* and *error*.
- EventTarget which dispatches Events
- Even promises may be considered as emitting notifications (*fulfilled*, *rejected*)

A Notification is simply an object with a name and an optional value.
It provides information about a new state, or even transmits an event.


```ts
interface INotificationConstructor {
  // converts an Event to a Notification
  fromEvent<TName extends string = string, TEvent extends Event = Event>(event: TEvent): INotification<TName, TEvent>;

  new<TName extends string, TValue>(name: TName, value?: TValue): INotification<TName, TValue>;
}


interface INotification<TName extends string, TValue> {
  readonly name: TName;
  readonly value: TValue;
}
```

We may use Observables to emit Notifications and Observers to filter them by name.



##### NotificationsObservable

***KeyValueMap***

First you need to know that NotificationsObservable are typed with a `KeyValueMap`.
It is simply an interface where the keys are the notifications' name; and the values, the associated value's type for this name.

```ts
type KeyValueMap<TKVMap, T> = {
  [K in KeyValueMapKeys<TKVMap>]: T;
};

type KeyValueMapKeys<TKVMap> = Extract<keyof TKVMap, string>;
type KeyValueMapValues<TKVMap> = TKVMap[KeyValueMapKeys<TKVMap>];

type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;
```

As an example:
```ts
interface MyEvents {
  'error': Error,
  'complete': any,
}
// may emit INotifications<'error', Error> | INotifications<'complete', any>
```

It is widely used with events listener for example, and supports existing KeyValueMap like `WindowEventMap`.

***NotificationsObservable***

```ts
interface INotificationsObservableMatchOptions {
  includeGlobalObservers?: boolean; // (default => false) if set to true, includes Observers which are not of type NotificationsObserver (assumes they receives all Notifications)
}

interface INotificationsObservableConstructor {
  new<TKVMap extends KeyValueMapGeneric>(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
}

interface INotificationsObservable<TKVMap extends KeyValueMapGeneric> extends IObservable<KeyValueMapToNotifications<TKVMap>> {
  // creates a NotificationsObserver with "name" and "callback" which observes this Observable
  addListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<K, TKVMap[K]>;

  // removes the Observable's NotificationsObservers matching "name" and "callback"
  removeListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): void;

  // like "addListener" but returns "this"
  on<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): this;

  // like "removeListener" but returns "this"
  off<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): this;

  // returns true if this observable has an Observer matching "name" and "callback".
  hasListener(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): boolean;
  
  // returns the list of Observer matching "name" and "callback"
  matches(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): IterableIterator<IObserver<KeyValueMapToNotifications<TKVMap>>>;
}
```

```ts
interface INotificationsObservableContext<TKVMap extends KeyValueMapGeneric> extends IObservableContextBase<KeyValueMapToNotifications<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;
  emit(value: KeyValueMapToNotifications<TKVMap>): void;
  dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value?: TKVMap[K]): void;
}
```

A NotificationsObservable is an Observable emitting some Notifications.
This may be used to acknowledge about a new state or about an event.
Moreover, it exposes some useful methods as shortcuts, and it is particularly effective with the help of `NotificationsObserver`.

###### Construct
```ts
new<TKVMap extends KeyValueMapGeneric>(create?: (context: INotificationsObservableContext<TKVMap>) => (TNotificationsObservableHook<TKVMap> | void)): INotificationsObservable<TKVMap>;
```
The constructor is the same as the one for an Observable, but `context` is slightly different:
it implements a `dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value?: TKVMap[K]): void;` function which simply emits a Notification composed of `name` and `value`.


###### addListener
```ts
addListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<K, TKVMap[K]>;
```
Creates a NotificationsObserver with `name` and `callback` which observes this Observable.
Equivalent to: `return new NotificationsObserver<K, TKVMap[K]>(name, callback).observe(this);`


###### removeListener
```ts
removeListener<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): void;
```
Removes all NotificationsObservers matching `name` and `callback` from this Observable.
If `callback` is omitted, removes all NotificationsObservers matching `name`.

**INFO**: `removeListener` uses the function `matches` which is less efficient than keeping a reference on the matching Observer(s).

```ts
const listener = (event: MouseEvent) => {
 console.log('click', event);
};

const observable = new EventsObservable<WindowEventMap>(window);
const observer = observable.addListener('click', listener);
observer.activate();
  
// ... later ...

// prefer
observer.deactivate();

// instead of 
observable.removeListener('click', listener);
```


###### on / off
```ts
on<K extends KeyValueMapKeys<TKVMap>>(name: K, callback: (value: TKVMap[K]) => void): this;
off<K extends KeyValueMapKeys<TKVMap>>(name: K, callback?: (value: TKVMap[K]) => void): this;
```
Just like `addListener` and `removeListener` but returns `this` instead.
Notice than the underlying created NotificationsObserver self activate.

*Example:* Listening to *click* event on *window*
```ts
const observable = new EventsObservable<WindowEventMap>(window)
  .on('click', (event: MouseEvent) => {
    console.log('click', event);
    observable.off('click');
  });
  
// equivalent to
window.addEventListener(window, (event: MouseEvent) => {
  console.log('click', event);
}, { once: true });
```

**INFO:** An EventsObservable is provided to simplify Events listening.

###### hasListener
```ts
hasListener(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): boolean;
```
Returns true if this observable has an NotificationsObserver matching `name` and `callback`.
If `callback` is omitted, returns all NotificationsObservers matching `name`.
If `options.includeGlobalObservers` is true, and this Observable is observed by at least one Observer with a type different than NotificationsObserver, then returns true.

**INFO:** `hasListener` is similar to `!observable.matches(name, callback, options).next().done`

###### matches
```ts
matches(name: string, callback?: (value: any) => void, options?: INotificationsObservableMatchOptions): IterableIterator<IObserver<KeyValueMapToNotifications<TKVMap>>>;
```
Returns an iterator which iterates over the list of NotificationsObservers matching `name` and `callback`.
If `callback` is omitted, returns all NotificationsObservers matching `name`.
If `options.includeGlobalObservers` is true, includes the list of Observers with a type different than NotificationsObserver.


##### NotificationsObserver
```ts
interface INotificationsObserverLike<TName extends string, TValue> {
  name: TName;
  callback: TNotificationsObserverCallback<TValue>;
}

interface INotificationsObserverConstructor {
  new<TName extends string, TValue>(name: TName, callback: TNotificationsObserverCallback<TValue>): INotificationsObserver<TName, TValue>;
}

interface INotificationsObserver<TName extends string, TValue> extends IObserver<INotification<string, any>>, INotificationsObserverLike<TName, TValue> {
  // the name to filter incoming notifications
  readonly name: TName;
  // the callback to call when notification passes the "name" filter
  readonly callback: TNotificationsObserverCallback<TValue>;

  // returns true if "name" and "callback" are the same than this Observer's name and callback
  matches(name: string, callback?: TNotificationsObserverCallback<any>): boolean;
}
```

A NotificationsObserver is a Observer which filters its incoming values (`INotification<N, T>`) by name:
If the notification has the same name than the Observer, the `callback` is called with the Notification's value.

*Example:* Listening to *click* and *mousemove* events on *window* (see previous example)
```ts
new EventsObservable<WindowEventMap>(window)
  .observedBy(new NotificationsObserver<'click', MouseEvent>('click', (event: MouseEvent) => {
    console.log('click', event);
  }).activate())
  .observedBy(new NotificationsObserver<'mousemove', MouseEvent>('mousemove', (event: MouseEvent) => {
      console.log('mousemove', event.clientX, event.clientY);
  }).activate())
  ;
```



---

#### EventsObservable
```ts
type EventKeyValueMap<TKVMap> = KeyValueMap<TKVMap, any>;

type EventsObservableKeyValueMapGeneric = {
  [key: string]: IEventLike;
};

interface IEventsObservableConstructor {
  new<TKVMap extends KeyValueMap<TKVMap, Event>, TTarget extends IEventsListener = IEventsListener>(target: TTarget, name?: KeyValueMapKeys<TKVMap> | null): IEventsObservable<TKVMap, TTarget>;
}

interface IEventsObservable<TKVMap extends EventKeyValueMap<TKVMap>, TTarget extends IEventsListener = IEventsListener> extends INotificationsObservable<TKVMap> {
  // the target of the events' listener
  readonly target: TTarget;

  // optional name of the event to listen to
  readonly name: KeyValueMapKeys<TKVMap> | null;
}
```

An EventsObservable transfers events dispatched by an `EventsListener`.

<details>
<summary>about EventsListener</summary>
<p>

##### EventsListener - abstract

An `EventsListener` (abstract class) is simply an *optional* wrapper looking like an `EventTarget`,
used to normalize various implementations of events' listeners (*browsers* and *NodeJS* having different ones).

```ts
// ABSTRACT !
interface IEventsListener {
  addEventListener(type: string, listener: (event: IEventLike) => void): void;

  removeEventListener(type: string, listener: (event: IEventLike) => void): void;

  dispatchEvent?(event: IEventLike): void;
}

// for the browser
interface IEventTargetEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventTarget>(target: TTarget): IEventTargetEventsListener<TTarget>;
}

interface IEventTargetEventsListener<TTarget extends PureEventTarget> extends IEventsListener {
  readonly target: TTarget;

  dispatchEvent(event: Event): void;
}

// for nodejs
interface IEventEmitterEventsListenerConstructor extends Omit<IIEventsListenerConstructor, 'new'> {
  new<TTarget extends PureEventEmitter>(target: TTarget): IEventEmitterEventsListener<TTarget>;
}

interface IEventEmitterEventsListener<TTarget extends PureEventEmitter> extends IEventsListener {
  readonly target: TTarget;
}

```

Because `EventTarget` shares the same implementation as `EventsListener`, you may provide directly an `EventTarget`
when creating a new `EventsObservable`.

##### EventLike - abstract

An `EventLike` (abstract class) is too another *optional* wrapper looking like an `Event`,
used for the same reasons as explained upper.

```ts
// ABSTRACT !
interface IEventLikeConstructor {
  new(type: string): IEventLike;
}

interface IEventLike {
  readonly type: string;
}
```


To create a basic `EventLike`, you may use a `GenericEvent`:

```ts
interface IGenericEventConstructor {
  new<T>(type: string, value: T): IGenericEvent<T>;
}

interface IGenericEvent<T> extends IEventLike {
  readonly value: T;
}
```

*Example:*

```ts
const myEvent = new GenericEvent('error', new Error(`Error!`));
```

**INFO:** `GenericEvent` can only be dispatched from an `EventsListener` !


For more details, you may take a look at the source files.

</p>
</details>

*Example:* Listening to *click* event on *window*
```ts
new EventsObservable<WindowEventMap>(window)
  .addListener('click', (event: MouseEvent) => {
    console.log('click', event);
  }).activate();
```

*Example:* Listening to an uniq type of event
```ts
const observer = new EventsObservable<WindowEventMap>(window, 'mousemove')
  .pipeTo(new Observer<INotification<'mousemove', MouseEvent>>((notification: INotification<'mousemove', MouseEvent>) => {
    console.log(`x: ${notification.value.clientX}, x: ${notification.value.clientY}`);
  })).activate();
  // INFO: cannot be observed by a NotificationsObservable with 'click' as name for example

setTimeout(() => {
  observer.deactivate();
}, 5000);
```

*Example:* NodeJS - Listening to *response* event on an http request
```ts
// declare an interface
interface ClientRequestEventMap {
  // because NodeJS doesnt return an Event,
  // the incomming values are automatically wrapped in a GenericEvent
  'response': IGenericEvent<IncomingMessage>;
}

const http = require('http');

const request: ClientRequest = http.get(`https://nodejs.org`);

// NodeJS uses EventEmitter instead of EventTarget, so we'll wrap the EventEmitter (response) into an EventEmitterEventsListener
const observable = new EventsObservable<ClientRequestEventMap>(new EventEmitterEventsListener(request))
  .on('response', (event: IGenericEvent<IncomingMessage>) => {
    console.log(`response`, event.value);
  });
```

---

#### FiniteStateObservable

A FiniteStateObservable is simply an Observable with a final state (at least *complete* or *error*), just like the RXJS's Observables.

It extends `NotificationsObservable` with the minimum following 3 *'events'*:
- `next: TValue`: the emitted values
- `complete: void`: when the Observable has no more data to emit
- `error: any`: when the Observable errored

Because FiniteStateObservable is pretty complex, I wont give more details here but if interested [you can read the documentation](./examples/05-more-details-about-finite-state-observable.md).

#### PromiseObservable

##### CancelToken

<details>
<summary>show</summary>
<p>

```ts
type TCancelStrategy =
  'resolve' // resolve the promise with void
  | 'reject' // reject the promise with the Token's reason
  | 'never' // (default) never resolve the promise, it stays in a pending state forever
  ;

type TCancelTokenWrapPromiseCallback<T> = (this: ICancelToken, resolve: (value?: TPromiseOrValue<T>) => void, reject: (reason?: any) => void, token: ICancelToken) => void;

type TOnCancelled = ((this: ICancelToken, reason: any) => TPromiseOrValue<void>) | undefined | null;

interface ICancelTokenConstructor {
  new(): ICancelToken;
  of(...tokens: ICancelToken[]): ICancelToken;
}

interface ICancelTokenKeyValueMap {
  cancel: any;
}


interface ICancelToken extends INotificationsObservable<ICancelTokenKeyValueMap> {
  readonly cancelled: boolean;
  readonly reason: any;

  // cancels the Token and notify the Promise to stop its job.
  cancel(reason?: any): void;

  // links this Token with some others tokens
  linkWithToken(...tokens: ICancelToken[]): () => void;


  // creates an AbortController linked with this Token
  toAbortController(): AbortController;

  // links this Token with an AbortController
  linkWithAbortController(controller: AbortController): () => void;

  // links this Token with an AbortSignal
  linkWithAbortSignal(signal: AbortSignal): () => void;


  // wraps a promise with a this Token
  wrapPromise<T>(
    promiseOrCallback: Promise<T> | TCancelTokenWrapPromiseCallback<T>,
    strategy?: TCancelStrategy,
    onCancelled?: TOnCancelled,
  ): Promise<T | void>;

  // wraps a function with this Token
  wrapFunction<CB extends (...args: any[]) => any>(
    callback: CB,
    strategy?: TCancelStrategy,
    onCancelled?: TOnCancelled,
  ): (...args: Parameters<CB>) => Promise<TPromiseType<ReturnType<CB>> | void>;

  // wraps the fetch arguments with this Token
  wrapFetchArguments(requestInfo: RequestInfo, requestInit?: RequestInit): [RequestInfo, RequestInit | undefined];

}
```

A CancelToken is a Token used to *"cancel"* something (generally an async task like a promise).
It is extremely useful to avoid unnecessary work in a promise chain or to abort async operations.

*Example:* Use CancelToken to know than a promise has been cancelled
```ts
const token = new CancelToken();
fetch('some-url')
  .then((response: Response) => {
    if (token.cancelled) { // if the token is cancelled, throw an error
      throw token.reason;
    } else {
      return response.json();
    }
  });

token.addListener('cancel', (error: any) => {
  console.log('Promise cancelled', error);
}).activate();

token.cancel(new Error('Promise cancelled'));
```

Promises don't have any 'cancelled' state or a way to dispatch/handle it natively.
For this reason a CancelToken may be used and **MUST** be checked in every then/catch to avoid unnecessary work.

###### of (static)
```ts
of(...tokens: ICancelToken[]): ICancelToken;
```
Creates a new CancelToken from a list of CancelTokens:
if one of the provided `tokens` is cancelled, cancel this Token with the cancelled token's reason.

###### cancel
```ts
cancel(reason?: any): void;
```
Calls this function to notify the observer that the token has been cancelled:
- emits a *Notification<'cancel', any>*
- enters in a *canceled* state

###### linkWithToken
```ts
linkWithToken(...tokens: ICancelToken[]): () => void;
```
Links this CancelToken with a list of tokens. If one of the provided `tokens` is cancelled, cancel this Token with the cancelled token's reason.

**INFO:** linkWith[name] methods return an undo function: calling this function will undo the link.

###### toAbortController / linkWithAbortController / linkWithAbortSignal
```ts
toAbortController(): AbortController;
linkWithAbortController(controller: AbortController): () => void;
linkWithAbortSignal(signal: AbortSignal): () => void;
```

Links this CancelToken with an AbortController which may be used in `fetch` for example.


*Example:* Abort a fetch promise with a CancelToken
```ts
const token = new CancelToken();
fetch('some-url', { signal: token.toAbortController().signal });

token.cancel(new Error('Promise cancelled')); // aborts the fetch
```

###### wrapPromise / wrapFunction / wrapFetchArguments

Wraps a promise, function or fetch argument to properly handle the cancel state of the Token.

*Example:*
```ts
function cancelTokenExample(): Promise<void> {
  const token: ICancelToken = new CancelToken();
  // 1) wrapFetchArguments => ensures fetch will be aborted when token is cancelled
  // 2) wrapPromise => ensures fetch won't resolve if token is cancelled
  return token.wrapPromise(fetch(...token.wrapFetchArguments('http://domain.com/request1')))
    .then(token.wrapFunction(function toJSON(response: Response) { // 3) ensures 'toJSON' is called only if token is not cancelled
      return response.json(); // 'wrapPromise' not required because we immediately return a promise inside 'wrapFunction'
    }))
    .then(token.wrapFunction(function next(json: any) { // 4) ensures 'next' is called only if token is not cancelled
      console.log(json);
      // continue...
    }));
}
```

**INFO:** You may also use the `CancellablePromise`
```ts
function cancellablePromiseExample(): ICancellablePromise<void> {
  return CancellablePromise.fetch('http://domain.com/request1')
    .then((response: Response) => {
      return response.json();
    })
    .then((json: any) => {
      console.log(json);
      // continue...
    });
}
```

</p>
</details>

##### PromiseObservable
```ts
type TPromiseObservableFinalState = TFiniteStateObservableFinalState | 'cancel';
type TPromiseObservableMode = TFiniteStateObservableMode | 'every';

interface IPromiseObservableKeyValueMap<T> extends IFiniteStateObservableKeyValueMapGeneric<T, TPromiseObservableFinalState> {
  cancel: any;
}

interface IPromiseObservableOptions extends IFiniteStateObservableExposedOptions<TPromiseObservableMode> {
}


type TPromiseObservableFactory<T> = (this: IPromiseObservable<T>, token: ICancelToken) => TPromiseOrValue<T>;


interface IPromiseObservableConstructor {
  new<T>(promiseFactory: TPromiseObservableFactory<T>, options?: IPromiseObservableOptions): IPromiseObservable<T>;
  fromPromise<T>(promise: Promise<T>, token?: ICancelToken, options?: IPromiseObservableOptions): IPromiseObservable<T>;
}


interface IPromiseObservable<T> extends IFiniteStateObservable<T, TPromiseObservableFinalState, TPromiseObservableMode, IPromiseObservableKeyValueMap<T>> {
}
```

A PromiseObservable *"converts"* a Promise to an Observable.
`promiseFactory` is a callback used to generate a Promise when an Observer observes this PromiseObservable.
A CancelToken is provided and is used to notify the promise that it has been cancelled.
This token may be cancelled by the Observable if it has no more observers,
or if the Observer which generated the promise stopped to observe it for example.


*Example:* Use Observable to call an API
```ts
function http(url) {
  return new PromiseObservable<Response>((token: CancelToken) => {
    return fetch(url, { signal: token.toAbortController().signal });
  });
}

const newsRequest = http('https://domain/api/news')
  .pipeThrough(pipePromise<Response, INewsJSON>((response: Response) => response.json()));
  
newsRequest
  .on('next', (response: INewsJSON) => {
    console.log('next', response);
  })
  .on('error', (error: Error) => {
    console.error('error', error);
  })
  .on('cancel', (reason: any) => {
    console.warn('cancel', reason);
  });
  
```
**INFO:** A `FetchObservable` is provided to simplify fetch requests.

By default, the first observer will call `promiseFactory` **once** (the returned promise may be cached with `options.mode = 'cache'` so following observers will receive the values),
even if the promise is cancelled or rejected.

When creating a new PromiseObservable you have access to a new `mode` in `options` => *every*: the `promiseFactory` will be called for each different Observers in this case.


##### FetchObservable
```ts
interface IFetchObservable extends IPromiseObservable<Response>  {
}
```

A FetchObservable is a simple wrapper around a PromiseObservable, used to do http requests.

*Example:* Use FetchObservable to call an API
```ts
new FetchObservable('https://domain/api/news')
  .pipeThrough(pipePromise((response: Response) => response.json()))
  .on('complete', (response: INewsJSON) => {
    console.log('complete', response);
  })
  .on('error', (error: Error) => {
    console.error('error', error);
  })
  .on('cancel', (reason: any) => {
    console.warn('cancel', reason);
  });
```














