
# How to create a simple event listener ?

## Introduction
This example show you how to create a simple Observable which listen incoming events from an `EventTarget`.

**WARN:** Remember, this is just an example, you should use the `EventsObservable` instead.

### 1) Create an Observable emitting events

First, we'll create a function which takes an EventTarget (ex: `window`) and an event's type (ex: `'click'`) as input,
and returns an Observable:

```ts
function createEventObservable<T extends Event>(target: EventTarget, name: string): Observable<T> {
  // return observable here
}

const observable = createEventObservable<MouseEvent>(window, 'click');
```

When constructing an Observable, we just have to provide a function giving us an access to a context:
```ts
// construct an Observable which emits only data of type 'Event'
new Observable<Event>((context: IObservableContext<Event>) => {
  // do something here
});
```

The `context` has a `emit` function used to... emit data though the Observable, and has an attribute called `observable` referencing this current Observable.

This 'create' function (the one provided to the Observable) may return an ObservableHook which is simply an object with 2 optional methods:
```ts
interface IObservableHook<T> {
  onObserved?(observer: IObserver<T>): void;
  onUnobserved?(observer: IObserver<T>): void;
}
```

The function `onObserved` is called everytime an Observer is activated and observes this Observable.
The function `onUnobserved` is similar but is called when an Observer is deactivated or stops observing this Observable.

Put together it gives us this default code to create an Observable:
```ts
new Observable<Event>((context: IObservableContext<Event>) => {
  return {
    onObserved(observer: IObserver<Event>) {
      // do something when the observable is observed
    },
    onUnobserved(observer: IObserver<Event>) {
      // do something when the observable is unobserved
    }
  };
});
```

We'll use `addEventListener` and `removeEventListener` to listen/stop listening events dispatched by `target` (EventTarget).

The event listener callback is simply a function which will receive an Event and emit this event though the Observable:
```ts
const listener = (event: Event) => context.emit(event);
```

We'll use the hook to start and stop the event listener:
 - When the first Observer observes the Observable, we call once `addEventListener`.
 - When no more Observers observe the Observable, we call `removeEventListener`.

This ensures we won't uselessly listen to events that we don't want to observe anymore or immediately.

All together it gives us:
```ts
function createEventObservable<T extends Event>(target: EventTarget, name: string): Observable<T> {
  return new Observable<T>((context: IObservableContext<T>) => {
    const listener = (event: T) => context.emit(event);
    return {
      onObserved() {
        if (context.observable.observers.length === 1) {
          target.addEventListener(name, listener);
        }
      },
      onUnobserved() {
        if (!context.observable.observed) {
          target.removeEventListener(name, listener);
        }
      }
    };
  });
}
```

### 2) Observe this Observable
Now, we have a function able to listen and emit Events through an Observable.
The next step is to react to these Events.

To create an Observer, we simply provide a callback function:
```ts
const observer = new Observer<Event>((event: Event) => {
  console.log('receive', event);
});
```
This callback receives the emitted Events where we can do whatever we need with them.

After this, we need to observe the Observable though: `observer.observe(observable)`.

**And remember**, by default, an Observer is into a *deactivated* state, so we need to `activate` it if we want to receive data.

With our freshly previously created function it gives us:
```ts
const observable = createEventObservable<MouseEvent>(window, 'click');
const observer = new Observer<MouseEvent>((event: MouseEvent) => {
  console.log(`x: ${event.clientX}, y: ${event.clientY}`);
}));
observer.observe(observable);
observer.activate(); // don't forget to activate the observer !
```

---
Because of the versatile and chainable nature of the observables, we may write some exact alternatives: 

```ts
const observer = new Observer<MouseEvent>((event: MouseEvent) => {
  console.log(`x: ${event.clientX}, y: ${event.clientY}`);
}))
  .observe(createEventObservable<MouseEvent>(window, 'click'))
  .activate();
```

```ts
const observer = createEventObservable<MouseEvent>(window, 'click')
  .pipeTo(new Observer<MouseEvent>((event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }))
  .activate();

// or

const observer = createEventObservable<MouseEvent>(window, 'click')
  .pipeTo(new Observer<MouseEvent>((event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }).activate()); // note the activate inside vs outside of pipeTo
```


My favorite one:
```ts
const observer = createEventObservable<MouseEvent>(window, 'click')
  .pipeTo((event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }).activate();
```

 
### Complete code

```ts
function createEventObservable<T extends Event>(target: EventTarget, name: string): Observable<T> {
  return new Observable<T>((context: IObservableContext<T>) => {
    const listener = (event: T) => context.emit(event);
    return {
      onObserved() {
        if (context.observable.observers.length === 1) {
          target.addEventListener(name, listener);
        }
      },
      onUnobserved() {
        if (!context.observable.observed) {
          target.removeEventListener(name, listener);
        }
      }
    };
  });
}

const observer = createEventObservable<MouseEvent>(window, 'click')
  .pipeTo((event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }).activate();
```

### Using EventsObservable

For simplicity and security, we should use EventsObservable instead of our previous function.

```ts
const observer = new EventsObservable<WindowEventMap>(window)
  .addListener('click', (event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }).activate();
```

More details on this in the following chapters.

---
- [CHAPTERS](README.md)
- [HOME](../README.md)














