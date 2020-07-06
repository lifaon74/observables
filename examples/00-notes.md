# Notes

### Potential unwanted effects

**While receiving a value (through the callback given to `new Observer(callback)`), the code should not impact, modify or trigger any of the parents Observables.**

Some functions of this library are resilient to this kind of cyclic / recursive function calls, but should absolutely be avoided.

For example, you may safely deactivate an Observer from its "onEmit" function:

```ts
const observer = new Observer<any>(() => {
  observer.deactivate();
 // at this point, potential other observers didn't received the value yet !
 // so removing this Observer from its parent's Observable.observers may impact the others
 // hopefully this specific action is properly handled by the library, as it is a common usecase to unsubscribe directly after receiving a value
}).activate();
```

On another hand, it's not safe to emit another value while another is still dispatching:

```ts
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

const observer1 = observable
  .on('next', () => { // (1)
    // this function is called immediately after context.dispatch('next', void 0);
    console.log('next 1');
    context.dispatch('complete', void 0); // dispatch a 'complete' event => (2) INFO the 'next' for the observer2 has not been called yet !
    // (3)
    // <= (4)
  });

const observer2 = observable
  .on('next', () => { // (4)
    console.log('next 2');
  })
  .on('complete', () => { // (2)
    // this function is called immediately after context.dispatch('complete', void 0);
    console.log('complete 2');
    // <= (3)
  });
```

The `observer2` will receive *'complete'* before *'next'* because *'complete'* was dispatched before all observers received *'next'*.

This is a typical example showing that you should never call any functions interacting with a parent's Observable inside the Observer's callback function.

Prefer, for example, delaying the operation for the next event loop with `setImmediate`, `setTimeout`, or `process.nextTick`

```ts
const observer1 = observable
  .on('next', () => {
    console.log('next 1');
    setImmediate(() => context.dispatch('complete', void 0));
  });
```

---
- [CHAPTERS](README.md)
- [HOME](../README.md)














