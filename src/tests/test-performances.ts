import { from, Observable as RXObservable, Subscriber as RXSubscriber } from 'rxjs';
import { FromIterableObservable } from '../observables/from/iterable/implementation';
import { Observable, ObservableClearObservers } from '../core/observable/implementation';
import { IObserver, Observer } from '../core/observer/public';
import { IObservable } from '../core/observable/interfaces';
import { NotificationsObservable } from '../notifications/core/notifications-observable/public';

/**
 * Test 'from' for an iterable
 */
export function testPerformances1() {
  console.time('test1');

  let sum: number = 0;
  for (let i = 0; i < 1e5; i++) {
    from([Math.random()][Symbol.iterator]())
      .subscribe((v) => (sum += v));
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < 1e5; i++) {
    new FromIterableObservable([Math.random()][Symbol.iterator]())
      .pipeTo((v) => (sum += v))
      .activate();
  }

  console.timeEnd('test2');
  console.log(sum);
}

/**
 * Test simple emit of one value
 */
export function testPerformances2() {
  let sum: number;

  console.time('test1');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      subscriber.next(Math.random());
    }).subscribe((v) => (sum += v));
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    new Observable((context) => {
      return {
        onObserved(): void {
          context.emit(Math.random());
        }
      };
    })
      .pipeTo((v) => (sum += v))
      .activate();
  }

  console.timeEnd('test2');
  console.log(sum);
}

/**
 * Test simple emit of one value with subscription and unsubscription
 */
export function testPerformances3() {
  let sum: number;

  console.time('test1');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      subscriber.next(Math.random());
      return () => {
        sum -= Math.random();
      };
    })
      .subscribe((v) => (sum += v))
      .unsubscribe();
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    new Observable((context) => {
      return {
        onObserved(): void {
          context.emit(Math.random());
        },
        onUnobserved(): void {
          sum -= Math.random();
        }
      };
    })
      .pipeTo((v) => (sum += v))
      .activate()
      .deactivate();
  }

  console.timeEnd('test2');
  console.log(sum);
}

/**
 * Test simple emit of one value, but outsource the constructors
 */
export function testPerformances4() {
  let sum: number;

  const rxObservables = Array.from({ length: 1e6 }, () => {
    return new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      subscriber.next(Math.random());
      return () => {
        sum -= Math.random();
      };
    });
  });

  const observables: IObservable<number>[] = Array.from({ length: 1e6 }, () => {
    return new Observable<number>((context) => {
      return {
        onObserved(): void {
          context.emit(Math.random());
        },
        onUnobserved(): void {
          sum -= Math.random();
        }
      };
    });
  });

  const rxObservers = Array.from({ length: 1e6 }, () => {
    return { next: (v: number) => (sum += v) };
    // return (v: number) => (sum += v);
  });

  const observers: IObserver<number>[] = Array.from({ length: 1e6 }, () => {
    return new Observer<number>((v) => (sum += v));
  });

  console.time('test1');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    rxObservables[i]
      .subscribe(rxObservers[i])
      .unsubscribe();
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < 1e6; i++) {
    observables[i]
      .pipeTo(observers[i])
      .activate()
      .deactivate();
  }

  console.timeEnd('test2');
  console.log(sum);
}


export function testPerformances5() {
  let sum: number;
  const count: number = 1e7;

  const rxObservable = new RXObservable<number>((subscriber: RXSubscriber<number>) => {
    for (let i = 0; i < count; i++) {
      subscriber.next(Math.random());
    }
    return () => {
      for (let i = 0; i < count; i++) {
        sum -= Math.random();
      }
    };
  });

  const observable: IObservable<number> = new Observable<number>((context) => {
    return {
      onObserved(): void {
        for (let i = 0; i < count; i++) {
          context.emit(Math.random());
        }
      },
      onUnobserved(): void {
        for (let i = 0; i < count; i++) {
          sum -= Math.random();
        }
      }
    };
  });

  console.time('test1');

  sum = 0;
  rxObservable
    .subscribe((v) => (sum += v))
    .unsubscribe();

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  observable
    .pipeTo((v) => (sum += v))
    .activate()
    .deactivate();

  console.timeEnd('test2');
  console.log(sum);
}

export function testPerformances6() {
  let sum: number;
  const count: number = 1e6;

  const rxObservable = new RXObservable<number>((subscriber: RXSubscriber<number>) => {
    for (let i = 0; i < count; i++) {
      subscriber.next(Math.random());
    }
    subscriber.complete();
    return () => {
      for (let i = 0; i < count; i++) {
        sum -= Math.random();
      }
    };
  });

  const observable = new NotificationsObservable<{ next: number, complete: void }>((context) => {
    return {
      onObserved(): void {
        if (context.observable.observers.length === 1) {
          for (let i = 0; i < count; i++) {
            context.dispatch('next', Math.random());
          }
        } else {
          context.dispatch('complete', void 0);
          ObservableClearObservers<any>(observable);
        }
      },
      onUnobserved(): void {
        if (!context.observable.observed) {
          for (let i = 0; i < count; i++) {
            sum -= Math.random();
          }
        }
      }
    };
  });

  console.time('test1');

  sum = 0;
  rxObservable
    .subscribe({
      next: (v) => (sum += v),
      complete: () => (sum += Math.random())
    });

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  observable
    .on('next', (v) => (sum += v))
    .on('complete', () => (sum += Math.random()));

  console.timeEnd('test2');
  console.log(sum);
}

export function testPerformances() {
  // testPerformances1();
  // testPerformances2();
  // testPerformances3();
  // testPerformances4();
  // testPerformances5();
  // testPerformances6();
}
