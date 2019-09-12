import { TupleArray } from '../classes/types';


function testRef() {

  type Ref<T> = () => T;

  function $const<T>(value: T): Ref<T> {
    return (): T => value;
  }

  function $let<T>(value: T): [Ref<T>, (value: T) => void] { // read, write
    return [
      (): T => value,
      (_value: T) => (value = _value)
    ];
  }

  function $add(a: Ref<number>, b: Ref<number>): Ref<number> {
    return (): number => (a() + b());
  }

  function $minus(a: Ref<number>, b: Ref<number>): Ref<number> {
    return (): number => (a() - b());
  }


  function $add$(...values: Ref<number>[]): Ref<number> {
    return (): number => {
      let sum: number = 0;
      for (let i = 0, l = values.length; i < l; i++) {
        sum += values[i]();
      }
      return sum;
    };
  }


  const a = $const(1);
  const b = $const(2);
  const sum = $add(a, b);

  console.log(a(), b(), sum());
}

/**
 * Advantages: fast
 * Inconvenient: lacks of methods
 */
export function testMicroObservablesv1() {

  type MObserver<T> = (value: T) => void;
  type MUndo = () => void;
  type MObservable<T> = (observer: MObserver<T>) => MUndo;


  function $source<T>(): [MObservable<T>, MObserver<T>] { // read, write
    const observers: Set<MObserver<T>> = new Set<MObserver<T>>();
    return [
      (observer: MObserver<T>) => {
        if (observers.has(observer)) {
          throw new Error(`Observer already used for this Observable`);
        } else {
          observers.add(observer);
        }
        return () => {
          observers.delete(observer);
        };
      },
      (value: T) => {
        for (const cb of Array.from(observers.values())) {
          cb(value);
        }
      }
    ];
  }

  function $const<T>(value: T): MObservable<T> {
    return (observer: MObserver<T>) => {
      observer(value);
      return () => {
      };
    };
  }

  function $let<T>(value?: T): [MObservable<T>, MObserver<T>] {
    const [pipe, emit] = $source<T>();

    return [
      (observer: MObserver<T>) => {
        const undo: MUndo = pipe(observer);
        observer(value as T);
        return undo;
      },
      (_value: T) => {
        if (_value !== value) {
          value = _value;
          emit(value);
        }
      }
    ];
  }

  function $timer(period: number): MObservable<void> {
    const [pipe, emit] = $source<void>();

    let count: number = 0;
    let timer: null | any = null;
    return (observer: MObserver<void>) => {
      const undo: MUndo = pipe(observer);
      count++;
      if (timer === null) {
        timer = setInterval(emit, period);
      }

      return () => {
        count--;
        if (count === 0) {
          clearInterval(timer);
          timer = null;
        }
        undo();
      };
    };
  }


  type MObservableCastTuple<T extends any[]> = {
    [K in keyof T]: MObservable<T[K]>;
  };

  type MObservableCastTupleArray<T extends any[]> = TupleArray<MObservableCastTuple<T>, MObservable<any>>;


  function $fnc<FNC extends (...args: any[]) => any>(fnc: FNC, args: MObservableCastTupleArray<Parameters<FNC>>): MObservable<ReturnType<FNC>> {
    const [pipe, emit] = $let<ReturnType<FNC>>();

    const values: any[] = Array.from({ length: args.length }, () => void 0);
    let undoArgsObservers: MUndo[] | null = null;

    let count: number = 0;
    return (observer: MObserver<ReturnType<FNC>>) => {
      const undo: MUndo = pipe(observer);
      count++;
      const _undoArgsObservers: MUndo[] = (undoArgsObservers === null)
        ? args.map((arg: MObservable<any>, index: number) => {
          return arg((value: any) => {
            values[index] = value;
            emit(fnc.apply(null, values));
          });
        })
        : undoArgsObservers;
      return () => {
        count--;
        if (count === 0) {
          for (let i = 0, l = _undoArgsObservers.length; i < l; i++) {
            _undoArgsObservers[i]();
          }
          undoArgsObservers = null;
        }
        undo();
      };
    };
  }

  function $add(a: MObservable<number>, b: MObservable<number>): MObservable<number> {
    return $fnc(add, [a, b]);
  }

  function add(a: number, b: number): number {
    return a + b;
  }

  function $listen<E extends Event>(target: EventTarget, name: string): MObservable<E> {
    const [pipe, emit] = $source<E>();

    let count: number = 0;
    const listener = (event: Event) => {
      emit(event as E);
    };
    return (observer: MObserver<E>) => {
      const undo: MUndo = pipe(observer);
      count++;
      if (count === 1) {
        target.addEventListener(name, listener);
      }

      return () => {
        count--;
        if (count === 0) {
          target.removeEventListener(name, listener);
        }
        undo();
      };
    };
  }

  function log<T>(title: string): MObserver<T> {
    return (v: T) => {
      console.log(title, v);
    };
  }


  const [a, _a] = $let(1);
  const [b, _b] = $let(2);

  a(log('a'));
  $timer(1000)(() => console.log('timer'));

  const sum = $add(a, b);

  sum(log('sum'));

  _a(4);
}


export function testMicroObservables() {

  type MObserver<T> = (value: T) => void;
  type MUnobserve = () => void;
  type MObservable<T> = (observer: MObserver<T>) => MUnobserve;
  type MObservableObserver<TObservable, TObserver> = { observable: MObservable<TObservable>; observer: MObserver<TObserver>; };

  function $$source<T>(): MObservableObserver<T, T> { // read, write
    const observers: Set<MObserver<T>> = new Set<MObserver<T>>();
    return {
      observable: (observer: MObserver<T>) => {
        if (observers.has(observer)) {
          throw new Error(`Observer already used for this Observable`);
        } else {
          observers.add(observer);
        }
        return () => {
          observers.delete(observer);
        };
      },
      observer: (value: T) => {
        for (const cb of Array.from(observers.values())) {
          cb(value);
        }
      }
    };
  }

  function $const<T>(value: T): MObservable<T> {
    return (observer: MObserver<T>) => {
      observer(value);
      return () => {};
    };
  }

  function $$let<T>(value?: T): MObservableObserver<T, T> {
    const { observable: pipe, observer: emit } = $$source<T>();
    return {
      observable: (observer: MObserver<T>) => {
        const unobserve: MUnobserve = pipe(observer);
        observer(value as T);
        return unobserve;
      },
      observer: _distinct(emit)
    };
  }

  function _distinct<T>(observer: MObserver<T>, value?: T): MObserver<T> {
    return (_value: T) => {
      if (_value !== value) {
        value = _value;
        observer(value);
      }
    };
  }

  function _debounce<T>(observer: MObserver<T>, period: number): MObserver<T> {
    let timer: any | null = null;
    return (value: T) => {
      if (timer !== null) {
        clearTimeout(timer);
      }
      timer = setTimeout(() => {
        timer = null;
        observer(value);
      }, period);
    };
  }

  function $debounce<T>(observable: MObservable<T>, period: number): MObservable<T> {
    return (observer: MObserver<T>) => {
      return observable(_debounce(observer, period));
    };
  }


  function $create<T>(
    pipe: MObservable<T>,
    init: () => void = () => {},
    clear: () => void = () => {},
  ): MObservable<T> {
    let count: number = 0;
    return (observer: MObserver<T>) => {
      let unobserve: MUnobserve | null = pipe(observer);
      count++;
      if (count === 1) {
        init();
      }

      return () => {
        if (unobserve !== null) {
          count--;
          if (count === 0) {
            clear();
          }
          unobserve();
          unobserve = null;
        }
      };
    };
  }

  function $timer(period: number): MObservable<void> {
    const { observable: pipe, observer: emit } = $$source<void>();
    let timer: any;
    return $create<void>(
      pipe,
      () => {
        timer = setInterval(emit, period);
      },
      () => {
        clearInterval(timer);
      }
    );
  }


  type MObservableCastTuple<T extends any[]> = {
    [K in keyof T]: MObservable<T[K]>;
  };

  type MObservableCastTupleArray<T extends any[]> = TupleArray<MObservableCastTuple<T>, MObservable<any>>;


  function $fncSync<FNC extends (...args: any[]) => any>(fnc: FNC, args: MObservableCastTupleArray<Parameters<FNC>>): MObservable<ReturnType<FNC>> {
    const { observable: pipe, observer: emit } = $$let<ReturnType<FNC>>();

    const values: any[] = Array.from({ length: args.length }, () => void 0);
    let unobserveArgs: MUnobserve[] | null = null;

    let returnValue: ReturnType<FNC>;
    let count: number = 0;
    return (observer: MObserver<ReturnType<FNC>>) => {
      let unobserve: MUnobserve | null = pipe(observer);
      count++;
      const _unobserveArgs: MUnobserve[] = (unobserveArgs === null)
        ? args.map((arg: MObservable<any>, index: number) => {
          return arg((argValue: any) => {
            values[index] = argValue;
            const _returnValue: ReturnType<FNC> = fnc.apply(null, values);
            if (_returnValue !== returnValue) {
              returnValue = _returnValue;
              emit(returnValue);
            }
          });
        })
        : unobserveArgs;
      return () => {
        if (unobserve !== null) {
          count--;
          if (count === 0) {
            for (let i = 0, l = _unobserveArgs.length; i < l; i++) {
              _unobserveArgs[i]();
            }
            unobserveArgs = null;
          }
          unobserve();
          unobserve = null;
        }
      };
    };
  }

  function $fnc<FNC extends (...args: any[]) => any>(fnc: FNC, args: MObservableCastTupleArray<Parameters<FNC>>): MObservable<ReturnType<FNC>> {
    const { observable: pipe, observer: emit } = $$let<ReturnType<FNC>>();

    const values: any[] = Array.from({ length: args.length }, () => void 0);
    let unobserveArgs: MUnobserve[];

    return $create<ReturnType<FNC>>(
      pipe,
      () => {
        unobserveArgs = args.map((arg: MObservable<any>, index: number) => {
            return arg((argValue: any) => {
              values[index] = argValue;
              emit(fnc.apply(null, values));
            });
          });
      },
      () => {
        for (let i = 0, l = unobserveArgs.length; i < l; i++) {
          unobserveArgs[i]();
        }
      }
    );
  }

  function $add(a: MObservable<number>, b: MObservable<number>): MObservable<number> {
    return $fnc(add, [a, b]);
  }

  function add(a: number, b: number): number {
    return a + b;
  }

  function $listen<E extends Event>(target: EventTarget, name: string): MObservable<E> {
    const { observable: pipe, observer: emit } = $$source<E>();
    const listener = (event: Event) => {
      emit(event as E);
    };
    return $create(
      pipe,
      () => {
        target.addEventListener(name, listener);
      },
      () => {
        target.removeEventListener(name, listener);
      }
    );
  }

  function _log<T>(title: string): MObserver<T> {
    return (v: T) => {
      console.log(title, v);
    };
  }


  const { observable: readA, observer: writeA } = $$let(1);
  const { observable: readB, observer: writeB } = $$let(2);

  const unreadA = readA(_log('a'));
  const unreadB = readB(_log('b'));

  const stopTimer = $timer(1000)(() => console.log('timer'));

  const sum = $debounce($add(readA, readB), 0);

  sum(_log('sum'));

  writeA(4);
  writeB(5);

  unreadA();
  writeA(6);

  const clickListener = $listen<MouseEvent>(window, 'click');
  clickListener(() => {
    console.log('onclick');
  });

  const clear = () => {
    unreadA();
    unreadB();
    stopTimer();
  };

  (window as any).clear = clear;
}

