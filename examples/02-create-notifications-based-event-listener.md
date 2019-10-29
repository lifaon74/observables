# How to create a notifications based event listener ?

In the first chapter, we saw how to emit Events though an Observable.
Now we'll try to do the same but we will emit Notifications instead of Events.

### Notification ?
A Notification is simply an object with a name and an optional value.

We may create one like this:

```ts
const notification = new Notification<'click', MouseEvent>('click', new MouseEvent('click'));
```

Because Notifications and Events are similar, we can create a Notification from an Event using:
```ts
const notification = Notification.fromEvent<'click', MouseEvent>(new MouseEvent('click'));
```

A NotificationsObservable is an Observable which emits Notifications, and provides some useful shortcut methods.

And, a NotificationsObserver is an Observer which receives Notifications only matching its name.

More details are available on the [home page](../README.md#notifications).


### 1) Create a NotificationsObservable

```ts
// strongly typed, so we need to provides a KVMap where values are Events
function createEventNotificationsObservable<TKVMap extends EventKeyValueMapConstraint<TKVMap>>(target: EventTarget, name: KeyValueMapKeys<TKVMap>): INotificationsObservable<TKVMap> {
  return new NotificationsObservable<TKVMap>((context: NotificationsObservableContext<TKVMap>) => {
    const listener = (event: Event) => {
      context.dispatch(event.type as KeyValueMapKeys<TKVMap>, event as KeyValueMapValues<TKVMap>); // use dispatch instead of emit
      // we may write 'context.emit(Notification.fromEvent<KeyValueMapKeys<TKVMap>, KeyValueMapValues<TKVMap>>(event));' intead
    };
    return {
      onObserved() {
        if (context.observable.observers.length === 1) { // if its the first observer to observe this observable, create a listener
          target.addEventListener(name, listener);
        }
      },
      onUnobserved() {
        if (!context.observable.observed) { // if there's no more Observers for this Observable, we can stop the listener.
          target.removeEventListener(name, listener);
        }
      }
    };
  });
}
```

A NotificationsObservable is constructed just like an Observable.
The `INotificationsObservableContext` is extremely similar to the IObservableContext, but provides a `dispatch<K extends KeyValueMapKeys<TKVMap>>(name: K, value?: TKVMap[K]): void;` function too.


### 2) Observe this NotificationsObservable

```ts
// creates a Observables listening some mouse events on window
// 4 examples doing the same thing (almost)

// 1) use 'addListener' to listen to 'mousemove' on X axis
const observer1 = createEventNotificationsObservable<WindowEventMap>(window, 'mousemove')
  .addListener('mousemove', (event: MouseEvent) => {
    console.log(`x: ${event.clientX}`);
  }).activate(); // WARN: don't forget to activate the observer !

// 2) use 'pipeTo' and NotificationsObserver (is strictly equal to 'addListener')
const observer2 = createEventNotificationsObservable<WindowEventMap>(window, 'mousemove')
  .pipeTo<INotificationsObserver<'mousemove', MouseEvent>>(new NotificationsObserver<'mousemove', MouseEvent>('mousemove', (event: MouseEvent) => {
    console.log(`y: ${event.clientY}`);
  })).activate();

// 3) use standard Observer
const observer3 = createEventNotificationsObservable(window, 'click')
  .pipeTo(new Observer<INotification<'click', MouseEvent>>((notification: INotification<'click', MouseEvent>) => {
    if (notification.name === 'click') {
      console.log(`click => x: ${notification.value.clientX}, x: ${notification.value.clientY}`);
    }
  })).activate();

// 4) use 'on' which is strictly equal to 'addListener' but returns the observable instead of the observer
const observable = createEventNotificationsObservable(window, 'mousedown')
  .on('mousedown', (event: MouseEvent) => {
    console.log(`mousedown => x: ${event.clientX}`);
  })
  .on('mousedown', (event: MouseEvent) => { // great way to chain listeners
    console.log(`mousedown => y: ${event.clientY}`);
  }); // INFO: the observers are automatically activated with 'on'
  // note that if we use 'on' we need to deactivate the observers though observable.observers when releasing some resources !
```


### Using EventsObservable

Our function is pretty cool, but a built in Observable already exists for this: `EventsObservable`.
It's more convenient and safer.

```ts
const observable = new EventsObservable<WindowEventMap>(window)
  .on('click', (event: MouseEvent) => {
    console.log(`click => button: ${event.button}`);
  })
  .on('mousemove', (event: MouseEvent) => {
    console.log(`mousemove => x: ${event.clientX}, x: ${event.clientY}`);
  });

// after 5s, stops observing the observable
setTimeout(() => {
  observable.clearObservers();
}, 5000);
```


---
- [CHAPTERS](README.md)
- [HOME](../README.md)
