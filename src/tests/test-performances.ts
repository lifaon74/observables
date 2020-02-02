import { from, merge, Observable as RXObservable, Subscriber as RXSubscriber } from 'rxjs';
import { IObserver, Observer } from '../core/observer/public';
import { IObservable } from '../core/observable/interfaces';
import { NotificationsObservable } from '../notifications/core/notifications-observable/public';
import { Observable, ObservableClearObservers } from '../core/observable/implementation';
import { FromIterableObservable } from '../notifications/observables/finite-state/built-in/from/iterable/public';
import { map } from 'rxjs/operators';
import { map as purePipeMap } from '../classes/pure-pipes';
import { mapPipe } from '../operators/pipes/mapPipe';

function timeExecution<T>(callback: () => T): { time: number; result: T } {
  const start: number = performance.now();
  const result: T = callback();
  const end: number = performance.now();
  return {
    time: end - start,
    result
  };
}

function logPerf(...times: number[]): void {
  const minTime: number = times.reduce((min: number, value: number) => Math.min(min, value), Number.POSITIVE_INFINITY);
  times.forEach((time: number, index: number) => {
    console.log(`time #${ index }`, Math.round(time), `(${Math.round((time / minTime) * 100) / 100})`);
  });
}

/**
 * Test the performances of many observables emitting values from an iterable
 *
 * Results: around 10 times slower to create the instance
 */
export function testPerformances1() {
  const count: number = 1e5;

  const { time: time1, result: result1 } = timeExecution(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      from([Math.random()][Symbol.iterator]())
        .subscribe((v) => (sum += v));
    }
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      new FromIterableObservable([Math.random()][Symbol.iterator]())
        .addListener('next', (v) => (sum += v))
        .activate();
    }
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);

}

/**
 * Test the performances of many observables emitting one value
 *
 * Results: around 4 times slower to create the instance
 */
export function testPerformances2() {
  const count: number = 1e6;

  const { time: time1, result: result1 } = timeExecution(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      new RXObservable<number>((subscriber: RXSubscriber<number>) => {
        subscriber.next(Math.random());
      }).subscribe((v) => (sum += v));
    }
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    let sum = 0;
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
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
}

/**
 * Test the performances of many observables emitting one value with subscription and unsubscription
 *
 * Results: around 4 times slower to create the instance
 */
export function testPerformances3() {
  const count: number = 1e6;

  const { time: time1, result: result1 } = timeExecution(() => {
    let sum = 0;
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
    return sum;
  });


  const { time: time2, result: result2 } = timeExecution(() => {
    let sum = 0;
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
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
}

/**é
 *  Test the performances of many observable emitting one value, and pre-create the the constructors
 *
 *  Results: around 4 times faster in the case of 'next', 50% more time in the case of pure function
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

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    for (let i = 0; i < count; i++) {
      rxObservables[i]
        .subscribe(rxObservers[i])
        .unsubscribe();
    }
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    for (let i = 0; i < count; i++) {
      observables[i]
        .pipeTo(observers[i])
        .activate()
        .deactivate();
    }
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
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

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    rxObservable
      .subscribe((v) => (sum += v))
      .unsubscribe();
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    observable
      .pipeTo((v) => (sum += v))
      .activate()
      .deactivate();
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
}


/**
 *  Test the performances of an observable emitting multiple values based on a Notification structure
 *
 *  Results: 0~25% more time
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

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    rxObservable
      .subscribe({
        next: (v) => (sum += v),
        complete: () => (sum += Math.random())
      });
    return sum;
  });


  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    observable
      .on('next', (v) => (sum += v))
      .on('complete', () => (sum += Math.random()));
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
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

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    for (let i = 0; i < count2; i++) {
      rxObservable
        .subscribe((v) => (sum += v));
    }
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    for (let i = 0; i < count2; i++) {
      observable
        .pipeTo((v) => (sum += v))
        .activate();
    }

    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
}


/**
 *  Test the performances of many observable emitting multiple values, observed by one observer
 *
 *  Results: around 20% less time
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

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    rxObservable
      .subscribe((v) => (sum += v));
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    observer.observe(...observables).activate();
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
}

/**
 *  Test the performances of one observable emitting multiple MAPPED values, observed by one observer
 *
 *  Results: around 2 times more time, but pure-pies are 50% faster
 */
export function testPerformances9() {
  const count: number = 1e7;
  let sum: number;

  const rxObservable = new RXObservable<number>((subscriber: RXSubscriber<number>) => {
    for (let i = 0; i < count; i++) {
      subscriber.next(Math.random());
    }
  }).pipe(
    map(a => a * 2)
  );

  const observable1: IObservable<number> = new Observable<number>((context) => {
    return {
      onObserved(): void {
        for (let i = 0; i < count; i++) {
          context.emit(Math.random());
        }
      },
    };
  });

  const observable2: IObservable<number> = observable1.pipeThrough(mapPipe<number, number>(a => a * 2));

  const observer1 = new Observer<number>(purePipeMap<number, number>((v) => (sum += v * 2), a => a * 2));
  const observer2 = new Observer<number>((v) => (sum += v));

  const { time: time1, result: result1 } = timeExecution(() => {
    sum = 0;
    rxObservable
      .subscribe((v) => (sum += v));
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    sum = 0;
    observer1.observe(observable1).activate();
    return sum;
  });

  const { time: time3, result: result3 } = timeExecution(() => {
    sum = 0;
    observer2.observe(observable2).activate();
    return sum;
  });

  console.log(result1, result2, result3);
  logPerf(time1, time2, time3);
}


/**
 *  Test the performances of one observable emitting one value each time it is observed, and activating/deactivated an observer
 *
 *  Results: around 50% faster
 */
export function testPerformances10() {
  const count: number = 1e7;
  let sum = 0;

  const rxObservable = new RXObservable<number>((subscriber: RXSubscriber<number>) => {
    subscriber.next(Math.random());
  });

  const observable = new Observable((context) => {
    return {
      onObserved(): void {
        context.emit(Math.random());
      }
    };
  });

  const observer =  observable.pipeTo((v) => (sum += v));

  const { time: time1, result: result1 } = timeExecution(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      rxObservable
        .subscribe((v) => (sum += v))
        .unsubscribe();
    }
    return sum;
  });

  const { time: time2, result: result2 } = timeExecution(() => {
    let sum = 0;
    for (let i = 0; i < count; i++) {
      observer.activate().deactivate();
    }
    return sum;
  });

  console.log(result1, result2);
  logPerf(time1, time2);
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
  // testPerformances9();
  testPerformances10();
}
