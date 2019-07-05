
# Periodic Emitter

Sometimes, you want to emit some values at periodic intervals. For this you may use `TimerObservable`.

It's an Observable for which you need to provide a period, and it will emit *void* (undefined) every `period` milliseconds.

```ts
// emits random values every second
const randomValueEmitter = new TimerObservable(1000)
  .pipeThrough(mapPipe(() => Math.random()));
```

**INFO:** The TimerObservable starts to emit values only if it has at least one observer.

---
- [CHAPTERS](../README.md)
- [HOME](../../README.md)














