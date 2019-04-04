## Observables V2 ##
The repo tries to redefine the Observables: what are they ? what's their purpose ? how can we improve current RXJS Obervables ?
This is unofficially related to the RXJS Observables and the [tc39 Observables proposal](https://github.com/tc39/proposal-observable).
I will try to define here a better definition and implementation of them from my point of view.

Before flaming, please give it a try 😉

To install:
```text
npm i @lifaon74/observables
```

Entry point: `public.js`, others may contain some private or garbage experiment code. I recommend you to use rollup to import/bundle the package,
but you may use an already bundled version in `bundle/`.
The minified, gzipped, esnext version is only 5K bytes !

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

- When a Observer observes/unobserve an Observable, the Observable is notified and may start/stop some jobs.

- **An ObservableObserver is both an Observer and an Observable**.
It receives data from its observed Observables, and emits same or others data to its observing Observers.
Its nothing more than a tuple `{ observer, observable }`

- A **Pipe** is an ObservableObserver which automatically enters in an *activated* state if it has at least one Observer,
and leaves this state (enters *deactivated*) if no more Observers are observing it.


As an image, we may compare an Observable with a source (emits data),
an ObservableObserver with a pipe (transforms/transfers data)
and a Observer with a sink (receives and process data).

To compare with RXJS, an Observer is both a RX.Observer and a RX.Subscription.


### Example: Observing Keyboard Events ###
Using the *Observable* constructor, we can create a function which returns an observable stream of events with a specific type for any EventTarget.
```ts
function listen<T extends Event>(target: EventTarget, name: string) {
  return new Observable<Event>((context: ObservableContext<Event>) => {
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
  .pipeTo(new Observer<KeyboardEvent>((value: KeyboardEvent) => {
    console.log(`Received key command: ${value.key}`)
  })).activate(); // don't forget to activate the observer !
```

In my opinions, RXJS operators are useful for lazy development but most of them are not really necessary.
They introduce a bigger level of complexity, a bigger bundle size, and slower code execution,
where you could simply do the filtering, mapping, error check, etc... directly into the destination in 99% of the cases (`.subscribe({ next(value) { /* filter here */ })`).
Only complex ones should be used.

```ts
const keyMapping = (cb: (value: string) => void) => {
  const keyCommands: any = { '38': 'up', '40': 'down' };
  return (event: KeyboardEvent) => {
    if (event.keyCode in keyCommands) {
      cb(keyCommands[event.keyCode]);
    }
  };
};

const observer = listen<KeyboardEvent>(target, 'keydown')
  .pipeTo(new Observer<KeyboardEvent>(keyMapping((value: string) => {
    console.log(`Received key command: ${value}`)
  }))).activate();
```


### Table of contents ###
<!-- toc -->
- [API](#api)
  * [Observable](#observable)
    + [Construct](#construct)
    + [pipeTo](#pipeto)
    + [pipeThrough](#pipethrough)
    + [pipe](#pipe)
    + [observedBy](#observedby)
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
      - [matches](#matches)
    + [NotificationsObserver](#notificationsobserver)
  * [EventObservable](#eventobservable)
  * [PromiseObservable](#promiseobservable)
    + [PromiseCancelToken](#promisecanceltoken)
      - [cancel](#cancel)
      - [toAbortController / linkWithAbortController / linkWithAbortSignal](#toabortcontroller--linkwithabortcontroller--linkwithabortsignal)
    + [PromiseObservable](#promiseobservable-1)
    + [FetchObservable](#fetchobservable)


### API ###

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
  pipeTo<O extends IObserver<T>>(observer: O): O;
  // creates an Observable from "callback" and observes this Observable with it
  pipeTo(callback: (value: T) => void): IObserver<T>;

  // observes this Observable with "observableObserver.observer" and return the Observable
  pipeThrough<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O['observable'];

  // observes this Observable with "observableObserver.observer" and return the observableObserver
  pipe<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O;
  
  // like "pipeTo" but returns this instead
  observedBy(...observers: TObserverOrCallback<T>[]): this;
}

type TObserverOrCallback<T> = IObserver<T> | ((value: T) => void);
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
pipeTo<O extends IObserver<T>>(observer: O): O;
pipeTo(callback: (value: T) => void): IObserver<T>;
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
pipeThrough<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O['observable'];
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
pipe<O extends IObservableObserver<IObserver<T>, IObservable<any>>>(observableObserver: O): O;
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
observedBy(...observers: TObserverOrCallback<T>[]): this;
```
Tells all the *observers* to observe this Observable.



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
  observe(...observables: IObservable<T>[]): this;

  // stops observing a list of Observables
  unobserve(...observables: IObservable<T>[]): this;

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

observe(...observables: IObservable<T>[]): this;
unobserve(...observables: IObservable<T>[]): this;

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
    create?: (context: IPipeContext<TValueObserver, TValueObservable>) => (IPipeHook<TValueObserver, TValueObservable> | void)
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
interface IPipeContext<TValueObserver, TValueObservable> {
  readonly pipe: IPipe<IObserver<TValueObserver>, IObservable<TValueObservable>>;

  emit(value: TValueObservable): void;
}

interface IPipeHook<TValueObserver, TValueObservable> extends IObservableHook<TValueObservable> {
  // called when this Observer receives data.
  onEmit?(value: TValueObserver): void;
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
  create?: (context: IPipeContext<TValueObserver, TValueObservable>) => (IPipeHook<TValueObserver, TValueObservable> | void)
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
It serves as instructing about an update of a state or about an event.

```ts
export type KeyValueMap<TKVMap, T> = {
  [K in KeyValueMapKeys<TKVMap>]: T;
};

export type KeyValueMapKeys<TKVMap> = Extract<keyof TKVMap, string>;
export type KeyValueMapValues<TKVMap> = TKVMap[KeyValueMapKeys<TKVMap>];

export type KeyValueMapGeneric = KeyValueMap<{ [key: string]: any }, any>;

```
```ts
interface INotificationConstructor {
 // converts an Event to a Notification
 fromEvent<N extends string = string, T extends Event = Event>(event: T): INotification<Record<N, T>>;

 new<TKVMap extends KeyValueMapGeneric>(name: KeyValueMapKeys<TKVMap>, value?: KeyValueMapValues<TKVMap>): INotification<TKVMap>;
}

interface INotification<TKVMap extends KeyValueMapGeneric> {
  readonly name: KeyValueMapKeys<TKVMap>;
  readonly value: KeyValueMapValues<TKVMap>;
}
```

We may use Observables to emit Notifications and Observers to filter them by name.



##### NotificationsObservable
```ts
interface INotificationsObservableConstructor {
  new<TKVMap extends KeyValueMapGeneric>(create?: (context: INotificationsObservableContext<TKVMap>) => (IObservableHook<INotification<TKVMap>> | void)): INotificationsObservable<TKVMap>;
}

interface INotificationsObservable<TKVMap extends KeyValueMapGeneric> extends IObservable<INotification<TKVMap>> {
  // creates a NotificationsObserver with "name" and "callback" which observes this Observable
  addListener<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<Pick<TKVMap, K>>;

  // removes the Observable's NotificationsObservers matching "name" and "callback"
  removeListener<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): void;

  // like "addListener" but returns "this"
  on<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): this;

  // like "removeListener" but returns "this"
  off<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): this;

  // returns the list of observed NotificationsObserver matching "name" and "callback"
  matches(name: string, callback?: (value: any) => void): IterableIterator<INotificationsObserver<TKVMap>>;
}
```

```ts
interface INotificationsObservableContext<TKVMap extends KeyValueMapGeneric> extends IObservableContext<INotification<TKVMap>> {
  readonly observable: INotificationsObservable<TKVMap>;
  dispatch<K extends keyof TKVMap>(name: K, value?: TKVMap[K]): void;
}
```

A NotificationsObservable is an Observable emitting some Notifications.
This may be used to acknowledge about a new state or about an event.
Moreover, it exposes some useful methods as shortcuts, and it is particularly effective with the help of `NotificationsObserver`.

###### Construct
```ts
new<TKVMap extends TKeyValueMap>(create?: (context: INotificationsObservableContext<TKVMap>) => (IObservableHook<TKVNotification<TKVMap>> | void)): INotificationsObservable<TKVMap>;
```
The constructor is the same as the one for an Observable, but `context` is slightly different:
it implements a `dispatch<K extends keyof TKVMap>(name: K, value?: TKVMap[K]): void` function which simply emits a Notification composed of `name` and `value`.


###### addListener
```ts
addListener<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): INotificationsObserver<Pick<TKVMap, K>>;
```
Creates a NotificationsObserver with `name` and `callback` which observes this Observable.
Equivalent to: `return new NotificationsObserver<Pick<TKVMap, K>>(name, callback).observe(this);`


###### removeListener
```ts
removeListener<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): void;
```
Removes all NotificationsObservers matching `name` and `callback` from this Observable.
If `callback` is omitted, removes all NotificationsObservers matching `name`.


###### on / off
```ts
on<K extends keyof TKVMap>(name: K, callback: (value: TKVMap[K]) => void): this;
off<K extends keyof TKVMap>(name: K, callback?: (value: TKVMap[K]) => void): this;
```
Just like `addListener` and `removeListener` but returns `this` instead.
Notice than the underlying created NotificationsObserver self activate.

*Example:* Listening to *click* event on *window*
```ts
const observable = new EventObservable<WindowEventMap>(window)
  .on('click', (event: MouseEvent) => {
    console.log('click', event);
    observable.off('click');
  });
  
// equivalent to
window.addEventListener(window, (event: MouseEvent) => {
  console.log('click', event);
}, { once: true });
```

**INFO:** An EventObservable is provided to simplify Events listening.

###### matches
```ts
matches(name: string, callback?: (value: any) => void): IterableIterator<TKVNotificationsObserver<TKVMap>>
```
Returns an iterator which iterates over the list of NotificationsObservers matching `name` and `callback`.
If `callback` is omitted, returns all NotificationsObservers matching `name`.


##### NotificationsObserver
```ts
interface INotificationsObserverConstructor {
  new<TKVMap extends KeyValueMapGeneric>(name: KeyValueMapKeys<TKVMap>, callback: TNotificationsObserverCallback<TKVMap>): INotificationsObserver<TKVMap>;
}

interface INotificationsObserver<TKVMap extends KeyValueMapGeneric> extends IObserver<INotification<TKVMap>> {
  // the name to filter incoming notifications
  readonly name: KeyValueMapKeys<TKVMap>;
  // the callback to call when notification passes the "name" filter
  readonly callback: TNotificationsObserverCallback<TKVMap>;

  // returns true if "name" and "callback" are the same than this Observer's name and callback
  matches(name: string, callback?: (value: any) => void): boolean;
}

type TNotificationsObserverCallback<TKVMap extends KeyValueMapGeneric> = (value: KeyValueMapValues<TKVMap>) => void;

```

A NotificationsObserver is a Observer which filters its incoming values (`INotification<N, T>`) by name:
If the notification has the same name than the Observer, the `callback` is called with the Notification's value.

*Example:* Listening to *click* and *mousemove* events on *window* (see previous example)
```ts
new EventObservable<WindowEventMap>(window)
  .observedBy(new NotificationsObserver<Record<'click', MouseEvent>>('click', (event: MouseEvent) => {
    console.log('click', event);
  }).activate())
  .observedBy(new NotificationsObserver<Record<'mousemove', MouseEvent>>('mousemove', (event: MouseEvent) => {
      console.log('mousemove', event.clientX, event.clientY);
  }).activate())
  ;
```



---

#### EventObservable
```ts
interface IEventsObservableKeyValueMapDefault {
  [key: string]: Event;
}

type TEventsObservableKeyValueMap<TKVMap = IEventsObservableKeyValueMapDefault> = {
  [P in keyof TKVMap]: Event;
};

interface IEventsObservableConstructor {
  new<TKVMap extends TEventsObservableKeyValueMap<TKVMap>, TTarget extends EventTarget = EventTarget>(target: TTarget, name?: TKVMapKeys<TKVMap> | null): IEventsObservable<TKVMap, TTarget>;
}

interface IEventsObservable<TKVMap extends TEventsObservableKeyValueMap<TKVMap>, TTarget extends EventTarget = EventTarget> extends INotificationsObservable<TKVMap> {
  // the target of the events' listener
  readonly target: TTarget;

  // optional name of the event to listen to
  readonly name: TKVMapKeys<TKVMap> | null;
}
```

An EventObservable transfers events dispatched by an EventTarget.

*Example:* Listening to *click* event on *window*
```ts
new EventObservable<WindowEventMap>(window)
  .addListener('click', (event: MouseEvent) => {
    console.log('click', event);
  }).activate();
```

*Example:* Listening to an uniq type of event
```ts
const observer = new EventsObservable<WindowEventMap>(window, 'mousemove')
  .pipeTo(new Observer<INotification<Record<'mousemove', MouseEvent>>>((notification: INotification<Record<'mousemove', MouseEvent>>) => {
    console.log(`x: ${notification.value.clientX}, x: ${notification.value.clientY}`);
  })).activate();
  // INFO: cannot be observed by a NotificationsObservable with 'click' as name for example

setTimeout(() => {
  observer.deactivate();
}, 5000);
```


#### PromiseObservable

##### PromiseCancelToken
```ts
interface IPromiseCancelTokenKeyValueMap {
  cancel: any;
}

interface IPromiseCancelTokenConstructor {
  new(): IPromiseCancelToken;
}

interface IPromiseCancelToken extends INotificationsObservable<IPromiseCancelTokenKeyValueMap> {
  readonly cancelled: boolean;
  readonly reason: any;

  // cancels the Token and notify the Promise to stop its job.
  cancel(reason?: any): void;

  // creates an AbortController linked with this Token
  toAbortController(): AbortController;

  /**
   * Links this Token with an AbortController
   *  If the AbortController aborts, the Token is cancelled
   *  If the Token is cancelled, aborts the AbortController
   */
  linkWithAbortController(controller: AbortController): () => void;

  /**
   * Links this Token with an AbortSignal
   *  If the AbortSignal aborts, the Token is cancelled
   *  WARN: cannot cancel a AbortSignal if the Token is cancelled, prefer using linkWithAbortController instead
   */
  linkWithAbortSignal(signal: AbortSignal): () => void;
}

```

A PromiseCancelToken is a Token used to *"cancel"* a promise.
It is extremely useful to avoid unnecessary work in a promise chain or to abort async operations.

*Example:* Use PromiseCancelToken to know than a promise has been cancelled
```ts
const token = new PromiseCancelToken();
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
For this reason a PromiseCancelToken may be used and **MUST** be checked in every then/catch to avoid unnecessary work.

###### cancel
```ts
cancel(reason?: any): void;
```
Calls this function to notify a promise it has been cancelled:
- emits a *Notification<'cancel', any>*
- enters in a *canceled* state

###### toAbortController / linkWithAbortController / linkWithAbortSignal
```ts
toAbortController(): AbortController;
linkWithAbortController(controller: AbortController): () => void;
linkWithAbortSignal(signal: AbortSignal): () => void;
```

Links this PromiseCancelToken with an AbortController which may be used in `fetch` for example.


*Example:* Abort a fetch promise with a PromiseCancelToken
```ts
const token = new PromiseCancelToken();
fetch('some-url', { signal: token.toAbortController().signal });

token.cancel(new Error('Promise cancelled')); // aborts the fetch
```


##### PromiseObservable
```ts
interface IPromiseNotificationKeyValueMap<TFulfilled, TErrored, TCancelled> {
  complete: TFulfilled;
  error: TErrored;
  cancel: TCancelled;
}

interface IPromiseObservableConstructor {
  new<TFulfilled, TErrored, TCancelled>(promiseFactory: (token: IPromiseCancelToken) => Promise<TFulfilled>, options?: IPromiseObservableOptions): IPromiseObservable<TFulfilled, TErrored, TCancelled>;
}

interface IPromiseObservable<TFulfilled, TErrored, TCancelled> extends INotificationsObservable<TPromiseNotificationType, TFulfilled | TErrored | TCancelled> {
  clearCachedPromise(): void;
}

interface IPromiseObservableClearOptions {
  immediate?: boolean; // default false
  complete?: boolean; // default false
  error?: boolean; // default true
  cancel?: boolean; // default true
}

interface IPromiseObservableOptions {
  clear?: IPromiseObservableClearOptions;
}

```

A PromiseObservable *"converts"* a Promise to an Observable.
`promiseFactory` is a callback used to generate a Promise when an Observer observes this PromiseObservable.
A PromiseCancelToken is provided and is used to notify the promise that it has been cancelled.
This token may be cancelled by the Observable if it has no more observers,
or if the Observer which generated the promise stopped to observe it for example.


*Example:* Use Observable to call an API
```ts
function http(url) {
  return new PromiseObservable<Response, Error, any>((token: PromiseCancelToken) => {
    return fetch(url, { signal: token.toAbortController().signal });
  });
}

const newsRequest = http('https://domain/api/news')
  .pipeThrough(pipePromise<Response, INewsJSON>((response: Response) => response.json()));
  
newsRequest
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
**INFO:** An FetchObservable is provided to simplify fetch requests.

When creating a new PromiseObservable you may specify some options:

- **clear**: used to auto cache/uncache the `promiseFactory`'s promise.
  - immediate: if set to true, when an Observer observes this Observable, the `promiseFactory` is called and not cached (so its called for each observers).
    If false, the promise returned by the `promiseFactory` is cached.
  - complete: if set to true, the promise is uncached when it fulfils.
  - error: if set to true, the promise is uncached when it errors.
  - cancel: if set to true, the promise is uncached when it cancels.

By default, the first observer will call `promiseFactory`, and the returned promise will be cached (so following observers won't generate more promises),
except if the promise is rejected or cancelled (in this case, the cached promise is cleared, and the next observer will call again `promiseFactory`).

You may manually clear the cached promise by calling `clearCachedPromise`.




##### FetchObservable
```ts
interface IFetchObservable extends IPromiseObservable<Response, Error, any>  {
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














