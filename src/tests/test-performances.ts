import { from, merge, Observable as RXObservable, Subscriber as RXSubscriber } from 'rxjs';
import { FromIterableObservable } from '../observables/from/iterable/implementation';
import { Observable, ObservableClearObservers } from '../core/observable/implementation';
import { IObserver, Observer } from '../core/observer/public';
import { IObservable } from '../core/observable/interfaces';
import { NotificationsObservable } from '../notifications/core/notifications-observable/public';

/**
 * Test the performances of many observables emitting values from an iterable
 *
 * Results: around 4 times slower to create the instance
 */
export function testPerformances1() {
  const count: number = 1e5;
  let sum: number;

  console.time('test1');

  sum = 0;
  for (let i = 0; i < count; i++) {
    from([Math.random()][Symbol.iterator]())
      .subscribe((v) => (sum += v));
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < count; i++) {
    new FromIterableObservable([Math.random()][Symbol.iterator]())
      .pipeTo((v) => (sum += v))
      .activate();
  }

  console.timeEnd('test2');
  console.log(sum);
}

/**
 * Test the performances of many observables emitting one value
 *
 * Results: around 4 times slower to create the instance
 */
export function testPerformances2() {
  const count: number = 1e6;
  let sum: number;

  console.time('test1');

  sum = 0;
  for (let i = 0; i < count; i++) {
    new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      subscriber.next(Math.random());
    }).subscribe((v) => (sum += v));
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < count; i++) {
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
 * Test the performances of many observables emitting one value with subscription and unsubscription
 *
 * Results: around 4 times slower to create the instance
 */
export function testPerformances3() {
  const count: number = 1e6;
  let sum: number;

  console.time('test1');

  sum = 0;
  for (let i = 0; i < count; i++) {
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
  for (let i = 0; i < count; i++) {
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

/**é
 *  Test the performances of many observable emitting one value, and pre-create the the constructors
 *
 *  Results: around 3 times faster in the case of 'next', 50% more time in the case of pure function
 */
export function testPerformances4() {
  const count: number = 1e6;
  let sum: number;

  const rxObservables = Array.from({ length: count }, () => {
    return new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      subscriber.next(Math.random());
      return () => {
        sum -= Math.random();
      };
    });
  });

  const observables: IObservable<number>[] = Array.from({ length: count }, () => {
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

  const rxObservers = Array.from({ length: count }, () => {
    // return { next: (v: number) => (sum += v) };
    return (v: number) => (sum += v);
  });

  const observers: IObserver<number>[] = Array.from({ length: count }, () => {
    return new Observer<number>((v) => (sum += v));
  });

  console.time('test1');

  sum = 0;
  for (let i = 0; i < count; i++) {
    rxObservables[i]
      .subscribe(rxObservers[i])
      .unsubscribe();
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < count; i++) {
    observables[i]
      .pipeTo(observers[i])
      .activate()
      .deactivate();
  }

  console.timeEnd('test2');
  console.log(sum);
}


/**
 *  Test the performances of an observable emitting multiple values
 *
 *  Results: around 30% less time
 */
export function testPerformances5() {
  const count: number = 1e7;
  let sum: number;

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


/**
 *  Test the performances of an observable emitting multiple values based on a Notification structure
 *
 *  Results: same time
 */
export function testPerformances6() {
  const count: number = 5e6;
  let sum: number;

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
        } else if (context.observable.observers.length === 2) {
          context.dispatch('complete', void 0);
          ObservableClearObservers<any>(observable);
        }
      },
      onUnobserved(_): void {
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


/**
 *  Test the performances of an observable emitting multiple values, observed many times
 *
 *  Results: around 50% less time
 */
export function testPerformances7() {
  const count1: number = 1e5;
  const count2: number = 1e2;
  let sum: number;

  const rxObservable = new RXObservable<number>((subscriber: RXSubscriber<number>) => {
    for (let i = 0; i < count1; i++) {
      subscriber.next(Math.random());
    }
  });

  const observable: IObservable<number> = new Observable<number>((context) => {
    return {
      onObserved(): void {
        if (context.observable.observers.length === count2) {
          for (let i = 0; i < count1; i++) {
            context.emit(Math.random());
          }
        }
      }
    };
  });

  console.time('test1');

  sum = 0;
  for (let i = 0; i < count2; i++) {
    rxObservable
      .subscribe((v) => (sum += v));
  }

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  for (let i = 0; i < count2; i++) {
    observable
      .pipeTo((v) => (sum += v))
      .activate();
  }

  console.timeEnd('test2');
  console.log(sum);
}


/**
 *  Test the performances of many observable emitting multiple values, observed by one observer
 *
 *  Results: around 40% less time
 */
export function testPerformances8() {
  const count1: number = 1e4;
  const count2: number = 1e3;
  let sum: number;

  const rxObservables = Array.from({ length: count1 }, () => {
    return new RXObservable<number>((subscriber: RXSubscriber<number>) => {
      for (let i = 0; i < count2; i++) {
        subscriber.next(Math.random());
      }
    });
  });

  const rxObservable = merge(...rxObservables);

  const observables: IObservable<number>[] = Array.from({ length: count1 }, () => {
    return new Observable<number>((context) => {
      return {
        onObserved(): void {
          for (let i = 0; i < count2; i++) {
            context.emit(Math.random());
          }
        },
      };
    });
  });

  const observer = new Observer<number>((v) => (sum += v));

  console.time('test1');

  sum = 0;
  rxObservable
    .subscribe((v) => (sum += v));

  console.timeEnd('test1');
  console.log(sum);


  console.time('test2');

  sum = 0;
  observer.observe(...observables).activate();

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
  // testPerformances7();
  // testPerformances8();
}
