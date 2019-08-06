# FiniteStateObservable

```ts
type TFiniteStateObservableFinalState = 'complete' | 'error';

type FinalStateConstraint<T> = IsSuperSet<T, TFiniteStateObservableFinalState> extends true
  ? ['next'] extends [T]
    ? 'superset must not contain next'
    : string
  : 'not a superset of TFiniteStateObservableFinalState';

type TFiniteStateObservableMode =
  'once' // (default) does not cache any values => after the final state (TFinalState), no observers will ever receive a value ('next')
  | 'uniq' // does not cache any values => after the final state, throws an error if a new observer observes 'next' or TFinalState.
  | 'cache' // caches own notifications ('next' and TFinalState). Every observer will receive the whole list of own emitted notifications
  | 'cache-final-state' // caches TFinalState notification. Every observer will receive this final state notification
  | 'cache-all' // caches all notifications (including ones with a different name than 'next', and TFinalState). Every observer will receive the whole list of all emitted notifications
  ;

type FiniteStateObservableModeConstraint<T> = IsSuperSet<T, TFiniteStateObservableMode> extends true
  ? string
  : 'not a superset of TFiniteStateObservableMode';


type TFiniteStateObservableState<TFinalState extends FinalStateConstraint<TFinalState>> =
  'next' // may emit data though 'next'
  | TFinalState
  ;

interface IFiniteStateObservableOptions<TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>> {
  finalStates?: Iterable<TFinalState>;
  modes?: Iterable<TMode>;
  mode?: TMode; // default: 'once'
}

type IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState extends FinalStateConstraint<TFinalState>> = {
  [K in TFinalState]: any;
} & {
  'next': TValue; // incoming values
  'complete': void; // when the Observable has no more data to emit
  'error': any; // when the Observable errored
};

type FiniteStateKeyValueMapConstraint<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TKVMap extends object> = KeyValueMapConstraint<TKVMap, IFiniteStateObservableKeyValueMapGeneric<TValue, TFinalState>>;

interface IFiniteStateObservableHook<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends TNotificationsObservableHook<TKVMap> {
}

type TFiniteStateObservableCreateCallback<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> =
  ((context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) => (IFiniteStateObservableHook<TValue, TFinalState, TKVMap> | void));


interface IFiniteStateObservableConstructor {
  new<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
    create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
    options?: IFiniteStateObservableOptions<TFinalState, TMode>,
  ): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
}

interface IFiniteStateObservable<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservable<TKVMap> {
  readonly state: TFiniteStateObservableState<TFinalState>;
  readonly mode: TMode;
}
```


```ts
interface IFiniteStateObservableContext<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>> extends INotificationsObservableContext<TKVMap> {
  readonly observable: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;

  next(value: TValue): void; // emits Notification('next', value)
  complete(): void; // emits Notification('complete', void)
  error(error?: any): void; // emits Notification('error', void)

  clearCache(): void;
}
```

A FiniteStateObservable is simply an Observable with a final state (at least *complete* or *error*), just like the RXJS's Observables. 
It is an helper to build Observables having a final state and should be used with care.

It extends `NotificationsObservable` with the minimum following 3 *'events'*:
- `next: TValue`: the emitted values
- `complete: void`: when the Observable has no more data to emit
- `error: any`: when the Observable errored

It works with *Generic* types:
- `TValue` represents the type of the value emitted though `next`
- `TFinalState` represents the list (as union of strings) of the final states of the FiniteStateObservable. At least it must contain `TFiniteStateObservableFinalState` (`complete` and `error`).
- `TMode` represents the mode (as union of strings) supported by the FiniteStateObservable. At least it must contain `TFiniteStateObservableMode`.
- `TKVMap` represents the KeyValueMap used by NotificationsObservable, meaning than more events than just `next`, `complete` and `error` may be emitted.


#### Construct
```ts
new<TValue, TFinalState extends FinalStateConstraint<TFinalState>, TMode extends FiniteStateObservableModeConstraint<TMode>, TKVMap extends FiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(
  create?: TFiniteStateObservableCreateCallback<TValue, TFinalState, TMode, TKVMap>,
  options?: IFiniteStateObservableOptions<TFinalState, TMode>,
): IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>;
```

The constructor is the same as the one for a NotificationsObservable, but `context` is slightly different:
it implements some shortcuts to emits Notifications: `next`, `complete` and `error`.

When the FiniteStateObservable is into a final state (`TFinalState`, ex: *error* or *complete*), you won't be allowed to emit `next` or `TFinalState` Notifications.

You may provide a second argument: `options`:

Its `mode` defines some useful behaviours:
- `once` (default): does not cache any values => after the final state (`TFinalState`), no observers will ever receive a value (`next`)
- `uniq`: does not cache any values => after the final state, throws an error if a new observer observes `next` or `TFinalState`.
- `cache`: caches own notifications (`next` and `TFinalState`). Every observer will receive the whole list of own emitted notifications
- `cache-final-state`: caches `TFinalState` notification. Every observer will receive this final state notification
- `cache-all`: caches all notifications (including ones with a different name than `next` and `TFinalState`). Every observer will receive the whole list of all emitted notifications

`finalStates?: Iterable<TFinalState>` represents the list of the final states of this FiniteStateObservable.
For example, the PromiseObservable has a `cancel` state too as its final state.

`modes?: Iterable<TMode>;` represents the list of the available modes of this FiniteStateObservable.
For example, the PromiseObservable has an extra `every` mode.

Usually `finalStates` and `modes` are hidden by a child class extending the FiniteStateObservable constructor.


##### Example: Creates a new FiniteStateObservable from an Iterable
```ts
function fromIterable<T>(iterable: Iterable<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
  return new FiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>((context) => {
    return {
      onObserved(): void {
        if (context.observable.state === 'next') {
          for (const value of iterable) {
            context.next(value);
          }
          context.complete();
        }
      }
    }
  }, { mode: 'cache' })
}

fromIterable([0, 1, 2, 3])
  .addListener('next', (value: number) => {
    console.log('next', value);
  })
  .activate();
```

**WARN:** This example is not optimized at all, do not use directly, instead use `FromIterableObservable`.
```ts
new FromIterableObservable<number>([0, 1, 2, 3], { mode: 'cache' })
  .addListener('next', (value: number) => {
    console.log('next', value);
  })
  .activate();
```

##### Example: Creates a new FiniteStateObservable from a ReadableStream
```ts
function fromReadableStream<T>(reader: ReadableStreamReader<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
  return new FiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>>((context) => {
    async function readAll() {
      let result: ReadableStreamReadResult<T>;
      while (!(result = await reader.read()).done) {
        context.next(result.value);
      }
      context.complete();
    }

    return {
      onObserved(): void {
        if (
          (context.observable.state === 'next')
          && (context.observable.observers.length === 1)
        ) {
          readAll();
        }
      }
    }
  }, { mode: 'cache' });
}

const response: Response = await fetch(URL.createObjectURL(new Blob([new Uint8Array(1e6)])));

fromReadableStream((response.body as ReadableStream<Uint8Array>).getReader())
  .on('next', (chunk: Uint8Array) => {
    console.log('chunk', chunk);
  })
  .on('complete', () => {
    console.log('complete');
  });

```

Same but shorter and simpler implementation using `FromAsyncIterableObservable`:
```ts
function fromReadableStreamUsingFromAsyncIterableObservable<T>(reader: ReadableStreamReader<T>): IFiniteStateObservable<T, TFiniteStateObservableFinalState, TFiniteStateObservableMode, IFiniteStateObservableKeyValueMapGeneric<T, TFiniteStateObservableFinalState>> {
  return new FromAsyncIterableObservable((async function * () {
    let result: ReadableStreamReadResult<T>;
    while (!(result = await reader.read()).done) {
      yield result.value;
    }
  })(), { mode: 'cache' });
}
```

**WARN:**: For better performances you should use `FromReadableStreamObservable` instead:
```ts
new FromReadableStreamObservable((response.body as ReadableStream<Uint8Array>).getReader())
  .on('next', (chunk: Uint8Array) => {
    console.log('chunk', chunk);
  })
  .on('complete', () => {
    console.log('complete');
  });
```

##### Some helpers using FiniteStateObservable

- `FromIterableObservable<T>`
- `FromAsyncIterableObservable<T>`
- `FromReadableStreamObservable<T>`
- `FromRXJSObservable<T>`
- `FileReaderObservable<T>`
- `PromiseObservable<T>`
- `FetchObservable`
- `XHRObservable`


---
- [CHAPTERS](README.md)
- [HOME](../README.md)

