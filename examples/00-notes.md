# Notes

### Potential unwanted effects

While receiving a value (through the callback given to `new Observer(callback)`),
the code should not impact, modify or trigger any of the parents Observables, nor the other Observers for these Observables.

Knowing developers sometimes do errors, or bypass on purpose not recommended actions,
most functions of this library are resilient to this kind of cyclic / recursive function calls (a function is still executing while you trigger it another time).
However, this should not be abused !

#### Example 1

```ts
const observer1 = new Observer<any>(() => {
  // lets assume observable.observers === [observer1, observer2, observer3]
  // at this point, other observers didn't received the value yet, only observer1
  observer.deactivate();
  // you're modifying observable.observers to [observer2, observer3]
  // Ouch ! Maybe you've impacted the for loop dispatching the value to the other observers ?
  // hopefully this specific action is properly handled by the library, as it is a common usecase to unsubscribe directly after receiving a value
})
  .observe(observable)
  .activate();
```

**INFO:** You may safely deactivate an Observer from its "onEmit" function:

#### Example 2 - theoretical 

```ts
// syntax:
// (N)     - a position in the code
// => (N)  - go to N
// <= (N)  - return to N

type EventsMap = {
  'next': any;
  'complete': void;
};

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

Oops ! With a simplistic implementation, the `observer2` will receive *'complete'* before *'next'* because *'complete'* was dispatched before all remaining observers received *'next'*.

**HOPEFULLY** this was just a theoretical example, and the library is resilient to this usecase too: dispatched values are always received in correct order.
If you dispatch a value 'B', while another 'A' is still dispatching, the value 'B' will wait until 'A' has been dispatched to all of its observers.

This is a typical example showing that you should avoid calling functions interacting with a parent's Observable inside the Observer's callback function.

If you really need it, the library will "fix" this potential issue, or you may delay the operation for the next event loop with `setImmediate`, `setTimeout`, or `process.nextTick`.
Just remember, that's a dangerous path.

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














