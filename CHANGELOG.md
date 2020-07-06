## v3.0.0

### Notable Changes

#### Add support for typescript 4.0.0

The new version of typescript doesn't support circular constraints anymore (before this, the support was not official, but some tricks could do the job).

This circular constraint was used in the `NotificationObservable` and its child classes to shape properly the `KeyValueMap` (map from an "event" key to a value).

The key **MUST** be a string, and the constraint enforced it. Sadly, it is no more possible, so the constraints has been moved from the class template to the methods directly.

As long as your `KeyValueMap`s only contain string keys, you won't see any differences.


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


