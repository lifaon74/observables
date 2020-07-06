## v3.0.0

### Notable Changes

#### Add support for typescript 4.0.0

The new version of typescript doesn't support circular constraints anymore (before this, the support was not official, but some tricks could do the job).

This circular constraint was used in the `NotificationObservable` and its child classes to shape properly the `KeyValueMap` (map from an "event" key to a value).

The key **MUST** be a string, and the constraint enforced it. Sadly, it is no more possible, so the constraints has been moved from the class template to the methods directly.

As long as your `KeyValueMap`s only contain string keys, you won't see any differences.

#### Add protection against recursive calls of the same Observable's context.emit function

```ts
let context: IObservableContext<any>;
const observable = new Observable<any>((_context: IObservableContext<any>) => {
  context = _context;
  setTimeout(() => {
    context.emit(1);
  }, 100);
});

observable
  .pipeTo((value: any) => {
    if (value === 1) {
      console.log('next 1', value);
      context.emit(2); // recursive call, because we call context.emit before the first emit has finished
    }
  }).activate();

observable
  .pipeTo((value: any) => {
    console.log('next 2', value);
  }).activate();
```

Before v3.0.0, calling `context.emit(value)`, while another one was executing for the same Observable,
"paused/interrupted" the current dispatched value (because of the recursive call on `emit`).
So the output was:

```
> 'next 1', 1
> 'next 2', 2
> 'next 2', 1
```

With version 3.0.0, calling `context.emit(value)` in the same context, will check first if a dispatch is pending.
If yes, then the dispatch is delayed until the current dispatched value is fully dispatched to all the Observers.
This ensures a more coherent comportment of the 'emit' function.
So the output is:

```
> 'next 1', 1
> 'next 2', 1
> 'next 2', 2
```

This "issue" is fixed too for the NotificationsObservable where we were able to receive events in a strange order.

A [note](./examples/00-notes.md) explains this in details.

### Minor changes

- upgrade class factory version + support

### Bux fix

- Fix various missing exports for: FiniteStateObservable, NotificationsObservable
- Fix various issues resulting to typescript upgrade

## 2020-10-04  v2.1.3

### Notable Changes

#### Tasks - experimental feature

Tasks are an **experimental feature**, started since v1.5.0 (2019-08-26), which allows developers to register special workflows, with the possibility to chain, abort, pause or resume them, and follow their progress.

It's somehow similar to the Promises ans Streams, but is based on Observables, and offer better control and feedback.

The code reached a certain maturity and is now ready to be tested in more complex environments, but remember: it's still an experimental feature which means things may evolve in the future.

Here is a concrete usecase example:

> The filesystem sometimes requires long operations. We may want to pause or abort them, break them in smaller chunks, and follow their progress.
> File copy or directory copy are a perfect examples of it.


```ts
const copyTask: ITask<void> = copyDirectory('/a/b/c', '/a/b/d');

copyTask
  .on('start', () => {
    console.log('start');
  })
  .on('complete', () => {
    console.log('complete');
  })
  .on('error', (error: any) => {
    console.log('error', error);
  })
  .on('abort', (error: any) => {
    console.log('abort', error);
  })
  .on('progress', (progress: IProgress) => {
    console.log('progress', progress.toString());
  })
;

// button to pause / resume task
const observable = new EventsObservable<HTMLElementEventMap>(button)
  .on('click', (event: MouseEvent) => {
    if (copyTask.state === 'await') {
      copyTask.start();
    } else if (copyTask.state === 'run') {
      copyTask.pause();
    } else if (copyTask.state === 'pause') {
      copyTask.resume();
    }
  });
```


