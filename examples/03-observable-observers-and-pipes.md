# ObservableObserver ?

One goal of the Observables is to allow chaining. Something similar to the array's methods:

```ts
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  .filter(_ => ((_ % 2) === 0)) // get even values (0, 2, 4, 6, 8)
  .map(_ => (_ * 2)) // multiply each values by 2
  .forEach(_ => console.log(_)); // print: 0, 2, 8, 12, 16
```

For this, we may use an ObservableObserver.

An ObservableObserver is not a class, it is simply an interface describing an object which have two properties:

```ts
interface IObservableObserver<TObserver extends IObserver<any>, TObservable extends IObservable<any>>  {
  observer: TObserver;
  observable: TObservable;
}
```

We may compare it to a [DuplexStream](https://nodejs.org/api/stream.html#stream_class_stream_duplex) for nodejs
or the pipeThough argument of the [w3c stream API](https://streams.spec.whatwg.org/#rs-pipe-through).

It is used only into the `pipeThough` and the `pipe` function of the Observable or as an IO (ex: WebSockets which emit and receive data).


---
We may create a basic "filter" ObservableObserver like this:

```ts
function filter<T>(filter: (value: T) => boolean): IObservableObserver<IObserver<T>, IObservable<T>> {
  let context: IObservableContext<T>;
  const observer = new Observer<T>((value: T) => {
    if (filter(value)) {
      context.emit(value);
    }
  }).activate(); // notice the activate
  
  const observable = new Observable<T>((_context: IObservableContext<T>) => {
    context = _context;
  });

  return {
    observer: observer,
    observable: observable,
  };
}

const observer = observable
  .pipeThough(filter(_ => ((_ % 2) === 0)))
  .pipeTo(_ => console.log(_));
// note than 'observable'.onObserved was trigerred even if 'observer' is not activated
observer.activate();
```

**INFO:** As you can see, there is a downside of this function: the *onObserved* and *onUnobserved* are not transferred to `observable`.
That's why Pipes exist.


# Pipe ?

A Pipe is a class which implements the ObservableObserver interface and self activate/deactivate.

```ts
function filter<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  let context: IObservableContext<Tout>;
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

const observer = observable
  .pipeThough(filter(_ => ((_ % 2) === 0)))
  .pipeTo(_ => console.log(_));
// note than 'observable'.onObserved was not trigerred because 'observer' is not activated
observer.activate(); // 'observable'.onObserved is trigerred
```

This time `observable` will receive the `onObserved` 'event' as soon as the *pipe*'s (Pipe/ObservableObserver) observable is observed,
and a `onUnobserved` 'event' as soon as the *pipe*'s observable is no more observed. This ensures a proper CPU resource usage.

For simple Pipes which simply uses Observer and Observable (not an EventsObservable for example), we may use the `create` function like so:

```ts
function filter<T>(filter: (value: T) => boolean): IPipe<IObserver<T>, IObservable<T>> {
  return Pipe.create<T, T>((context: IPipeContext<T, T>) => {
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

# How to reproduce the first example with array ?

Observables comes with a bunch of operators: they are pipes or helpers around Observables and Observers, and are located into `./operators/public.ts`.

```ts
/*
[0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
  .filter(_ => ((_ % 2) === 0))
  .map(_ => (_ * 2))
  .forEach(_ => console.log(_));
*/

from<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]) // operator which converts an Iterable to an Observable
  .pipeThough(filterPipe<number>(_ => ((_ % 2) === 0))) // operator which filters incomming values
  .pipeThough(mapPipe<number, number>(_ => (_ * 2))) // operator which transforms (multiplies by 2) incomming values
  .pipeTo(_ => console.log(_))
  .activate();
```

## WARNING
Using `filterPipe` or `mapPipe`, and in a general manner any ObservableObserver without thinking of the side effects
(just like RXJS is doing in most of the cases) is a bad behaviour !

Why ? Because you're basically using complex classes and structures (well optimized, but it doesnt matter) instead of a simple `if` and transform.
You add more complexity, and CPU execution time, where things should be simpler.

A better implementation would be:

```ts
from<number>([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
  .pipeTo((value: number) => {
    if ((value % 2) === 0) {
      console.log(value * 2);
    }
  })
```

The only acceptable case of using Pipe: when you already have an Observable (ex: coming from a tier lib),
want to apply some workflow to it and return another Observable. Something like:
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

Final words: always prefer to use "native" code instead of Observable's pipes (for RXJS too !), you'll gain in performance !

---
- [CHAPTERS](README.md)
- [HOME](../README.md)