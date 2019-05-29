export type TVoidCB = () => void;
export type TDestination<Tin> = (data: Tin) => void;
export type TTransform<Tin, Tout> = (data: Tin) => Tout;

function CreateEmptyArray(length: number): any[] {
  return new Array(length).fill(void 0);
}

function CreateArray<T>(length: number, map: (index: number) => T): T[] {
  // return Array.from({ length: length }, (v: any, i: number) => map(i));
  return CreateEmptyArray(length).map((v: any, i: number) => map(i));
}

// /**
//  * Creates sources: modifying 'sources' array will modify the pipe.
//  * @param {TDestination<Tin>[]} sources
//  * @return {TDestination<Tin>[]}
//  */
// export function sourcePointers<Tin>(sources: TDestination<Tin>[]): TDestination<Tin>[] {
//   return sources.map((v: any, index: number) => ((a: Tin) => sources[index](a)));
// }

// export function passThrough<T>(data: T) {
//   return data;
// }

export const noop: TDestination<any> = () => void 0;

/*** BASE ***/

// export function destination<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
//   return destination;
// }

/**
 * Emits transformed data with 'transform' into 'destination'.
 * @param {TDestination<Tout>} destination
 * @param {TTransform<Tin, Tout>} transform
 * @return {TDestination<Tin>}
 */
export function map<Tin, Tout>(destination: TDestination<Tout>, transform: TTransform<Tin, Tout>): TDestination<Tin> {
  return (a: Tin) => destination(transform(a));
}

/**
 * Clones a callback
 * @param {TDestination<Tin>} destination
 * @return {TDestination<Tin>}
 */
export function clone<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
  // return transform(callback, _ => _);
  return (a: Tin) => destination(a);
}


/**
 * Merges many destinations: calling the result's function will emit in all destinations.
 * Opposite of split.
 * @param {TDestination<Tin>[]} destinations
 * @return {TDestination<Tin>}
 */
export function merge<Tin>(destinations: TDestination<Tin>[]): TDestination<Tin> {
  return (a: Tin) => {
    for (const destination of destinations) {
      destination(a);
    }
  };
}

export function mergeTwo<Tin>(d1: TDestination<Tin>, d2: TDestination<Tin>): TDestination<Tin> {
  return (a: Tin) => {
    d1(a);
    d2(a);
  };
}

/**
 * Merges two destinations. One of the destinations may be void.
 * @param {TDestination<Tin> | void} d1
 * @param {TDestination<Tin>} d2
 * @return {TDestination<Tin>}
 */
export function safeMergeTwo<Tin>(d1: TDestination<Tin> | void, d2: TDestination<Tin> | void): TDestination<Tin> {
  if (d1 === void 0) {
    return d2 as TDestination<Tin>;
  } else if (d2 === void 0) {
    return d1 as TDestination<Tin>;
  } else {
    return mergeTwo(d1 as TDestination<Tin>, d2 as TDestination<Tin>);
  }
}


export type ExtractDestinationTypes<T> = {
  [P in keyof T]: T[P] extends TDestination<infer U> ? U : never
}

/**
 * Joins many destinations: calling the result's function with an array will dispatch the values individuality for each destination.
 * @Example
 *   join([_ => console.log('0', _), _ => console.log('1', _)])([0, 1]);
 *   => '0' 0, '0' 1 (first destination will receive 0, the second will receive 1)
 *
 * @param {T} destinations
 * @return {TDestination<ExtractDestinationTypes<T extends TDestination<any>[]>>}
 */
export function join<T extends TDestination<any>[]>(...destinations: T): TDestination<ExtractDestinationTypes<T>> {
  return (a: any[]) => {
    for (let i = 0, l = destinations.length; i < l; i++) {
      destinations[i](a[i]);
    }
  };
}

/**
 * Splits one destination: calling one of the result's functions will emit in destination.
 * Opposite of merge.
 * @param {TDestination<Tin>} destination
 * @param {number} number
 * @return {TDestination<Tin>[]}
 */
export function split<Tin>(destination: TDestination<Tin>, number: number = 2): TDestination<Tin>[] {
  return CreateArray<TDestination<Tin>>(number, () => destination);
}

/**
 * Like split but clones destination for each entry
 * @param {TDestination<Tin>} destination
 * @param {number} number
 * @return {TDestination<Tin>[]}
 */
export function splitClones<Tin>(destination: TDestination<Tin>, number: number = 2): TDestination<Tin>[] {
  return CreateArray<TDestination<Tin>>(number, () => ((a: Tin) => destination(a)));
}

/**
 * Disjoins one destination: calling one of the result's functions will emit an array of values in destination.
 * Opposite of join.
 * @Example
 *   const [a, b] = disjoin(_ => console.log(_));
 *   a.emit(0); // [0, undefined]
 *   b.emit(1); // [0, 1]
 *   b.emit(2); // [2, 1]
 * @param {TDestination<Tin[]>} destination
 * @param {number} number
 * @return {TDestination<Tin>[]}
 */
export function disjoin<T extends TDestination<any>[]>(destination: TDestination<ExtractDestinationTypes<T>>, number: number = 2): T {
  const data: any[] = new Array(number).fill(void 0);
  return CreateArray<TDestination<any>>(number, (index: number) => {
    return (a: any) => {
      data[index] = a;
      destination(data as any);
    };
  }) as any;
}

export function race<Tin>(destination: TDestination<Tin>, number: number = 2): TDestination<Tin>[] {
  let done: boolean = false;
  return CreateArray<TDestination<Tin>>(number, () => {
    return (a: Tin) => {
      if (!done) {
        done = true;
        destination(a);
      }
    };
  });
}


/*** FILTERS ***/

/**
 * Emits data into 'destination' if 'predicate' is satisfied.
 * @param {TDestination<Tin>} destination
 * @param {(value: Tin) => boolean} predicate
 * @return {TDestination<Tin>}
 */
export function filter<Tin>(destination: TDestination<Tin>, predicate: (value: Tin) => boolean): TDestination<Tin> {
  return (a: Tin) => {
    if (predicate(a)) {
      destination(a);
    }
  };
}

/**
 * Emits only distinct values.
 * @param {TDestination<Tin>} destination
 * @param {boolean} previousValue
 * @return {TDestination<Tin>}
 */
export function distinct<Tin>(destination: TDestination<Tin>, previousValue: Tin): TDestination<Tin> {
  return (a: Tin) => {
    if (a !== previousValue) {
      previousValue = a;
      destination(a);
    }
  };
}

/**
 * Catches errors in 'destination' and emits them in 'caught'
 * @param {TDestination<Tin>} destination
 * @param {TDestination<TError>} caught
 * @return {TDestination<Tin>}
 */
export function catchError<Tin, TError = any>(destination: TDestination<Tin>, caught: TDestination<TError>): TDestination<Tin> {
  return (a: Tin) => {
    try {
      destination(a);
    } catch (error) {
      caught(error);
    }
  };
}


/**
 * Creates a condition on 'destination', returns the 'source' and the 'condition' ([IDestination<Tin>, IDestination<boolean>]]
 *  - if 'condition' emits false, data are cached and not emitted in 'destination'
 *  - if 'condition' emits true, cached data is emitted immediately in destination and next data will be normally emitted
 * -> 'source' is where to emit data
 * -> 'condition' is an emitter, which will enable/disable emits in 'destination'
 * @param {TDestination<Tin>} destination
 * @param {boolean} defaultState
 * @return {[TDestination<Tin> , TDestination<boolean>]}
 */
export function condition<Tin>(destination: TDestination<Tin>, defaultState: boolean = true): [TDestination<Tin>, TDestination<boolean>] {
  let data: Tin;
  let dataChanged: boolean = false;
  let bool: boolean = defaultState;

  const emit = () => {
    if (bool && dataChanged) {
      dataChanged = false;
      destination(data);
    }
  };

  return [
    (_data: Tin) => {
      data = _data;
      dataChanged = true;
      emit();
    },
    (_bool: boolean) => {
      // if (_bool !== bool) {
      bool = _bool;
      emit();
      // }
    }
  ];
}


export function reemitter<Tin>(destination: TDestination<Tin>, previousValue: Tin): [TDestination<Tin>, TDestination<undefined>] {
  return [
    (a: Tin) => {
      previousValue = a;
      destination(a);
    },
    () => {
      destination(previousValue);
    },
  ];
}


/*** TRANSFORMS ***/

export function reduce<Tin>(destination: TDestination<Tin>, reducer: (previousValue: Tin, value: Tin) => Tin, previousValue: Tin): TDestination<Tin> {
  return (a: Tin) => {
    previousValue = reducer(previousValue, a);
    destination(previousValue);
  };
}

export function flatten<Tin>(destination: TDestination<Tin>): TDestination<Tin[]> {
  return (values: Tin[]) => {
    for (const value of values) {
      destination(value);
    }
  };
}


/*** AWAITERS ***/

// take until
export function until<Tin>(destination: TDestination<Tin>, predicate: (value: Tin) => boolean, includeLast: boolean = false): TDestination<Tin> {
  let done: boolean = false;
  return (a: Tin) => {
    if (!done) {
      done = predicate(a);
      if (!done || includeLast) {
        destination(a);
      }
    }
  };
}

// skip until
export function wait<Tin>(destination: TDestination<Tin>, predicate: (value: Tin) => boolean, includeLast: boolean = true): TDestination<Tin> {
  let done: boolean = false;
  return (a: Tin) => {
    if (done) {
      destination(a);
    } else {
      done = predicate(a);
      if (done && includeLast) {
        destination(a);
      }
    }
  };
}

// function count<Tin>(destination: IDestination<Tin>): IDestination<number> {
//   return until(reduce() =>, () => );
// }


/*** TIMING ***/

/**
 * Emits a value only after a particular time span determined by the function 'period' has passed without another source emission.
 * @param {TDestination<Tin>} destination
 * @param {(a: Tin) => number} period
 * @return {TDestination<Tin>}
 */
export function debounce<Tin>(destination: TDestination<Tin>, period: (a: Tin) => number): TDestination<Tin> {
  let timer: any | null = null;
  return (a: Tin) => {
    if (timer !== null) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      timer = null;
      destination(a);
    }, period(a));
  };
}

export function debounceTime<Tin>(destination: TDestination<Tin>, period: number): TDestination<Tin> {
  return debounce(destination, () => period);
}

/**
 * Emits the last value received inside an requestAnimationFrame.
 * @param {TDestination<Tin>} destination
 * @return {TDestination<Tin>}
 */
export function debounceFrame<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
  let id: number | null = null;
  return (a: Tin) => {
    if (id !== null) {
      cancelAnimationFrame(id);
    }
    id = requestAnimationFrame(() => {
      id = null;
      destination(a);
    });
  };
}


/**
 * Emits a value, then ignores subsequent source values for a duration determined by 'period'
 * @param {TDestination<Tin>} destination
 * @param {(a: Tin) => number} period
 * @return {TDestination<Tin>}
 */
export function throttle<Tin>(destination: TDestination<Tin>, period: (a: Tin) => number): TDestination<Tin> {
  let timer: any | null = null;
  return (a: Tin) => {
    if (timer === null) {
      destination(a);
      timer = setTimeout(() => {
        timer = null;
      }, period(a));
    }
  };
}

export function throttleTime<Tin>(destination: TDestination<Tin>, period: number): TDestination<Tin> {
  return throttle(destination, () => period);
}

/**
 * Emits the first value received inside an requestAnimationFrame.
 * @param {TDestination<Tin>} destination
 * @return {TDestination<Tin>}
 */
export function throttleFrame<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
  let id: number | null = null;
  return (a: Tin) => {
    if (id === null) {
      id = requestAnimationFrame(() => {
        id = null;
        destination(a);
      });
    }
  };
}

/**
 * Emits a value, then, for a duration determined by 'period', if a value is received, cache it and trigger it at the end of the timer.
 * As result, a value if emitted evey 'period' ms at the best, and the last emitted value if always transmitted.
 * @param destination
 * @param _period
 */
export function period<Tin>(destination: TDestination<Tin>, _period: (a: Tin) => number): TDestination<Tin> {
  let timer: any | null = null;
  let previousValue: Tin;
  let hasValue: boolean = false;
  const _destination = (a: Tin) => {
    if (timer === null) {
      destination(a);
      hasValue = false;
      timer = setTimeout(() => {
        timer = null;
        if (hasValue) {
          _destination(previousValue);
        }
      }, _period(a));
    } else {
      hasValue = true;
      previousValue = a;
    }
  };
  return _destination;
}

export function periodTime<Tin>(destination: TDestination<Tin>, _period: number): TDestination<Tin> {
  return period(destination, () => _period);
}

export function periodFrame<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
  let id: number | null = null;
  let value: Tin;
  return (a: Tin) => {
    value = a;
    if (id === null) {
      id = requestAnimationFrame(() => {
        id = null;
        destination(value);
      });
    }
  };
}

/**
 * Delays the emission of the values.
 * @param {TDestination<Tin>} destination
 * @param {(a: Tin) => number} period
 * @return {TDestination<Tin>}
 */
export function delay<Tin>(destination: TDestination<Tin>, period: (a: Tin) => number): TDestination<Tin> {
  return (a: Tin) => {
    setTimeout(() => {
      destination(a);
    }, period(a));
  };
}

export function delayTime<Tin>(destination: TDestination<Tin>, period: number): TDestination<Tin> {
  return delay(destination, () => period);
}

/**
 * Calls 'destination' in a requestAnimationFrame
 * @param {TDestination<Tin>} destination
 * @return {TDestination<Tin>}
 */
export function frame<Tin>(destination: TDestination<Tin>): TDestination<Tin> {
  return (a: Tin) => {
    requestAnimationFrame(() => {
      destination(a);
    });
  };
}

/**
 * Boolean Arithmetic
 */

// export function and(destination: TDestination<boolean>): []


/*** OTHERS ***/

export function log<Tin>(destination: TDestination<Tin>, name?: string): TDestination<Tin> {
  return (a: Tin) => {
    if (name) {
      console.log('%c' + name, 'color: #006f23', a);
    } else {
      console.log(a);
    }
    destination(a);
  };
}
