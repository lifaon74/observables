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
function testMicoObservables() {

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
        for (const cb of observers.values()) {
          cb(value);
        }
      }
    ];
  }

  function $const<T>(value: T): MObservable<T> {
    return (observer: MObserver<T>) => {
      observer(value);
      return () => { };
    };
  }

  function $let<T>(value: T = void 0): [MObservable<T>, MObserver<T>] {
    const [pipe, emit] = $source<T>();

    return [
      (observer: MObserver<T>) => {
        const undo: MUndo = pipe(observer);
        observer(value);
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

    // let count: number = 0;
    // let timer: null | any = null;
    // return (observer: MObserver<void>) => {
    //   count++;
    //   if (timer === null) {
    //     timer = setInterval(observer, period);
    //   }
    //
    //   return () => {
    //     count++;
    //     if (count === 0) {
    //       clearInterval(timer);
    //       timer = null;
    //     }
    //   };
    // };
  }


  type MObservableCastTuple<T extends any[]> = {
    [K in keyof T]: MObservable<T[K]>;
  };

  type MObservableCastTupleArray<T extends any[]> = TupleArray<MObservableCastTuple<T>, MObservable<any>>;


  function $fnc<FNC extends (...args: any[]) => any>(fnc: FNC, args: MObservableCastTupleArray<Parameters<FNC>>): MObservable<ReturnType<FNC>> {
    const [pipe, emit] = $let<ReturnType<FNC>>();

    const values: any[] = Array.from({ length: args.length}, () => void 0);
    let undoArgsObservers: MUndo[] | null = null;

    let count: number = 0;
    return (observer: MObserver<ReturnType<FNC>>) => {
      const undo: MUndo = pipe(observer);
      count++;
      if (undoArgsObservers === null) {
        undoArgsObservers = args.map((arg: MObservable<any>, index: number) => {
          return arg((value: any) => {
            values[index] = value;
            emit(fnc.apply(null, values));
          });
        });
      }

      return () => {
        count--;
        if (count === 0) {
          for (let i = 0, l = undoArgsObservers.length; i < l; i++) {
            undoArgsObservers[i]();
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
