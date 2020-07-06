# ObservableObserver ?

One goal of the Observables is to allow chaining. Something similar to the array's methods:

```ts
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  .filter(_ => ((_ % 2) === 0)) // get even values (0, 2, 4, 6, 8)
  .map(_ => (_ * 2)) // multiply each values by 2
  .forEach(_ => console.log(_)); // print: 0, 2, 8, 12, 16
```

For this, we may use an ObservableObserver.

An ObservableObserver is not a class, it is simply an interface describing an object with two properties:

```ts
interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>>  {
  observer: TObserver;
  observable: TObservable;
}
```

We may compare it with a [DuplexStream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) for nodejs
or the pipeThough argument of the [w3c stream API](https://streams.spec.whatwg.org/#rs-pipe-through).

It is mainly used into the `pipeThough` or the `pipe` function of the Observable to transform/filter data, or as an IO (ex: WebSockets which emit and receive data).

---

As an example, we may create a basic "filter" ObservableObserver like this:

```typescript
function filter<T>(filter: (value: T) => boolean): IObservableObserver<IObserver<T>, IObservable<T>> {
  let context: IObservableContext<T>;
  const observer = new Observer<T>((value: T) => {
    if (filter(value)) {
      context.emit(value);
    }
  }).activate(); // notice the activate
  
  // problem => observer is always activated

  const observable = new Observable<T>((_context: IObservableContext<T>) => {
    context = _context;
  });

  return {
    observer: observer,
    observable: observable,
  };
}

const someObserver = someObservable
  .pipeThough(filter(_ => ((_ % 2) === 0)))
  .pipeTo(_ => console.log(_));
// note than 'observable'.onObserved was triggered even if 'observer' is not activated
someObserver.activate();
```

**INFO:** As you may see, there is a downside in this example: the *onObserved* and *onUnobserved* are **NOT** handled by `observable`,
which means that `observer` will remains activated forever and `someObservable` will never receive a *onObserved* and *onUnobserved*.
It's an issue because we potentially don't free some resources like an aborted xhr request, or a cancelled setInterval.

A better code would be:

```typescript
function filter<T>(filter: (value: T) => boolean): IObservableObserver<IObserver<T>, IObservable<T>> {
  let context: IObservableContext<T>;
  const observer = new Observer<T>((value: T) => {
    if (filter(value)) {
      context.emit(value);
    }
  });

  const observable = new Observable<T>((_context: IObservableContext<T>) => {
    context = _context;
    return {
      onObserved() {
        // 'observer' is only activated when at least one Observer observes our 'observable'
        if (context.observable.observers.length >= 1) {
          observer.activate();
        }
      },
      onUnobserved() {
        // 'observer' is deactivated when our 'observable' is no more observed
        if (!context.observable.observed) {
          observer.deactivate();
        }
      }
    };
  });

  return {
    observer: observer,
    observable: observable,
  };
}
```

This previous code is a little "long" and error prone if we manually deactivate the observer. Hopefully, a simple alternative exists: the *Pipes*

# Pipe ?

A Pipe is a class implementing the ObservableObserver interface which self activate/deactivate.

```ts
function filter<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  return new Pipe<IObserver<T>, IObservable<T>>(() => {
    let context: IObservableContext<T>;
    return {
      observer: new Observer<T>((value: T) => {
        if (filter(value)) {
          context.emit(value);
        }
      }),
      observable: new Observable<T>((_context: IObservableContext<T>) => {
        context = _context;
      })
    };
  });
}
```

This time `observable` will receive the `onObserved` 'event' as soon as the *pipe*'s (Pipe) observable is observed,
and a `onUnobserved` 'event' as soon as the *pipe*'s observable is no more observed. This ensures a proper CPU resource usage.

**INFO:** Pipes should always be used when you need to pipe (transform, filter, whatever) data from an observable to another.

If you plan to only use an Observer and Observable (not an EventsObservable for example), you may use the static `create` function instead:

```ts
function filter<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: TPipeContextBase<T, T>) => {
    return {
      onEmit(value: T): void {
        if (filter(value)) {
          context.emit(value);
        }
      }
    };
  });
}
```

# How to reproduce the first example with an array ?

Observables come with a bunch of operators: they are pipes or helpers around Observables/Observers, and are located into `./operators`.

```ts
/*
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  .filter(_ => ((_ % 2) === 0))
  .map(_ => (_ * 2))
  .forEach(_ => console.log(_));
*/

from<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) // converts an Iterable to an Observable
  .pipeThough(filterPipe<number>(_ => ((_ % 2) === 0))) // filters incoming values
  .pipeThough(mapPipe<number, number>(_ => (_ * 2))) // transforms incoming values (multiplied by 2)
  .pipeTo(_ => console.log(_))
  .activate();
```

## WARNING
Using `filterPipe` or `mapPipe`, and in general any ObservableObserver without thinking of the side effects
(just like RXJS is doing in most of the cases) is a bad behaviour !

Why ? Because you're basically using complex classes and structures (well optimized, but it doesn't matter) instead of a simple `if` and transform in some cases.
Such a usage add more complexity layers, meaning longer CPU execution time, where things should be simpler:
*it's a computationally inefficient manner to use the pipes*, where [cpu budget is a thing](https://www.google.com/search?q=js%20cpu%20budget) (ex: [The cost of javascript](https://medium.com/@addyosmani/the-cost-of-javascript-in-2018-7d8950fbb5d4))

A better implementation would be:

```ts
from<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  .pipeTo((value: number) => {
    if ((value % 2) === 0) {
      console.log(value * 2);
    }
  })
```

**Remember this simple rule:** the only acceptable case using Pipe is when you already have an Observable (ex: coming from a tier lib, from a function argument, ...),
want to apply some operations on the incoming data, and return another Observable.

Something like:
```ts
function filterMapPipe() {
  return filterPipe<number>(_ => ((_ % 2) === 0))
    .pipeThough(mapPipe<number, number>(_ => (_ * 2)));
}

// but prefer
function filterMapPipeBetter() {
  return Pipe.create<number, number>((context: IPipeContext<number, number>) => {
    return {
      onEmit(value: number): void {
        if ((value % 2) === 0) {
          context.emit(value * 2);
        }
      }
    };
  });
}
```

*Final words:* always prefer to use "native" code instead of Observable's pipes (for RXJS too !), you'll gain in overall performance !
It's not because they are bad optimized, but because simple native code is always faster !

---
- [CHAPTERS](README.md)
- [HOME](../README.md)
