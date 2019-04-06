
# How to create a simple event listener ?

## Introduction
This example show you how to create a simple Observable which listen incoming events from an `EventTarget`.

**WARN:** Remember, this is just an example, you should use the `EventsObservable` instead.

### 1) Create the Observable

First, we'll create a function which takes an EventTarget (ex: `window`), and an event's type (ex: `'click''`),
and return an Observable:

```ts
function createEventObservable<T extends Event>(target: EventTarget, name: string): Observable<T> {
  // return observable here
}

const observable = createEventObservable<MouseEvent>(window, 'click');
```

The when constructing an Observable, we provide a function which give us access to a context:
```ts
// construct an Observable which emits only data of type 'Event'
new Observable<Event>((context: IObservableContext<Event>) => {
  // do something here
});
```

The context provides a `emit` function which... emits data though the Observable, and an `observable` attribute referencing the current Observable.

This 'create' function may return an ObservableHook which is simply an object with 2 optional methods:
```ts
interface IObservableHook<T> {
  onObserved?(observer: IObserver<T>): void;
  onUnobserved?(observer: IObserver<T>): void;
}
```

The function `onObserved` will be called everytime an Observer is activated and observes this Observable.
The function `onUnobserved` is similar but is called when an Observer is deactivated or stops observing this Observable.

Put together it gives us the default code to create an Observable:
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

We'll use `addEventListener` and `removeEventListener` to listen/stop listen events dispatched by `target` (EventTarget).

The event listener callback is simply a function which will receive an Event and emit this event though the Observable:
```ts
const listener = (event: Event) => context.emit(event);
```

We'll use the hook to start and stop the event listener:
 - When the first Observer observes the Observable, we call once `addEventListener`.
 - When no more Observers observe the Observable, we call `removeEventListener`.


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

### 2) Observe the Observable
Now we have a function able to listen to Events with an Observable, we may want to react to these Events.

To create an Observer, we simply need to provide a callback function:
```ts
const observer = new Observer<Event>((event: Event) => { // receives the emitted events 
  console.log('receive', event);
});
```
Then we may observe an Observable though: `observer.observe(observable)`.

By default, an observer is into a *deactivated* state, so we need to `activate` it.

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

 
### Full code

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

For simplicity, we may (and probably should) use EventsObservable instead of our previous function.

```ts
const observer = new EventsObservable<WindowEventMap>(window)
  .addListener('click', (event: MouseEvent) => {
    console.log(`x: ${event.clientX}, y: ${event.clientY}`);
  }).activate();
```

More details in the following chapters.

---
- [CHAPTERS](README.md)
- [HOME](../README.md)














