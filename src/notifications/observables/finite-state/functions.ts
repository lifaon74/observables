import {
  TFinalStateConstraint, TFiniteStateKeyValueMapConstraint, TFiniteStateObservableFinalState,
  TFiniteStateObservableMode, TFiniteStateObservableModeConstraint
} from './types';
import { IFiniteStateObservable } from './interfaces';
import {
  FINITE_STATE_OBSERVABLE_PRIVATE, IFiniteStateObservableInternal, IFiniteStateObservablePrivate
} from './privates';
import { EnumToString } from '../../../helpers';
import { KeyValueMapToNotifications } from '../../core/notifications-observable/types';

/** FUNCTIONS **/


/**
 * Creates a Set containing the default final states of a FiniteStateObservable
 */
export function GetFiniteStateObservableDefaultFinalStates(): Set<TFiniteStateObservableFinalState> {
  return new Set<TFiniteStateObservableFinalState>(['complete', 'error'] as TFiniteStateObservableFinalState[]);
}

/**
 * Converts 'finalStates' to a proper Set<TFinalState>. Verify its content complies with TFiniteStateObservableFinalState.
 */
export function NormalizeFiniteStateObservableFinalStates<TFinalState extends TFinalStateConstraint<TFinalState>>(finalStates?: Iterable<TFinalState>): Set<TFinalState> {
  const defaultSet: Set<TFiniteStateObservableFinalState> = GetFiniteStateObservableDefaultFinalStates();

  if (finalStates === void 0) {
    return defaultSet as Set<TFinalState>;
  } else if (Symbol.iterator in finalStates) {
    const _finalStates: Set<TFinalState> = new Set<TFinalState>(finalStates);

    if (_finalStates.has('next' as TFinalState)) {
      throw new TypeError(`finalStates must not contain 'next'`);
    }

    {
      const iterator: Iterator<TFiniteStateObservableFinalState> = defaultSet.values();
      let result: IteratorResult<TFiniteStateObservableFinalState>;
      while (!(result = iterator.next()).done) {
        if (!_finalStates.has(result.value as TFinalState)) {
          throw new TypeError(`finalStates must contain '${ result.value }'`);
        }
      }
    }

    {
      const iterator: Iterator<TFinalState> = _finalStates.values();
      let i: number = 0;
      let result: IteratorResult<TFinalState>;
      while (!(result = iterator.next()).done) {
        if (typeof result.value !== 'string') {
          throw new TypeError(`Expected Iterable of string as finalStates, found '${ result.value }' at index ${ i }`);
        }
        i++;
      }
    }

    return _finalStates;
  } else {
    throw new TypeError(`Expected Iterable<TFinalState> or void as finalStates`);
  }


}


/**
 * Creates a Set containing the default modes of a FiniteStateObservable
 */
export function GetFiniteStateObservableDefaultModes(): Set<TFiniteStateObservableMode> {
  return new Set<TFiniteStateObservableMode>(['once', 'uniq', 'cache', 'cache-per-observer', 'cache-final-state', 'cache-final-state-per-observer', 'cache-all', 'cache-all-per-observer'] as TFiniteStateObservableMode[]);
}

/**
 * Converts 'modes' to a proper Set<TMode>. Verify its content complies with TFiniteStateObservableMode.
 */
export function NormalizeFiniteStateObservableModes<TMode extends TFiniteStateObservableModeConstraint<TMode>>(modes?: Iterable<TMode>): Set<TMode> {
  const defaultSet: Set<TFiniteStateObservableMode> = GetFiniteStateObservableDefaultModes();

  if (modes === void 0) {
    return defaultSet as Set<TMode>;
  } else if (Symbol.iterator in modes) {
    const _modes: Set<TMode> = new Set<TMode>(modes);

    {
      const iterator: Iterator<TFiniteStateObservableMode> = defaultSet.values();
      let result: IteratorResult<TFiniteStateObservableMode>;
      while (!(result = iterator.next()).done) {
        if (!_modes.has(result.value as TMode)) {
          throw new TypeError(`modes must contain '${ result.value }'`);
        }
      }
    }

    {
      const iterator: Iterator<TMode> = _modes.values();
      let i: number = 0;
      let result: IteratorResult<TMode>;
      while (!(result = iterator.next()).done) {
        if (typeof result.value !== 'string') {
          throw new TypeError(`Expected Iterable of string as modes, found '${ result.value }' at index ${ i }`);
        }
        i++;
      }
    }

    return _modes;
  } else {
    throw new TypeError(`Expected Iterable<TMode> or void as finalStates`);
  }
}

/**
 * Ensures than 'mode' complies with 'modes' and TFiniteStateObservableMode
 */
export function NormalizeFiniteStateObservableMode<TMode extends TFiniteStateObservableModeConstraint<TMode>>(modes: Set<TMode>, mode?: TMode): TMode {
  if (mode === void 0) {
    return 'once' as TMode;
  } else if (modes.has(mode)) {
    return mode;
  } else {
    throw new TypeError(`Expected void or ${ EnumToString(Array.from(modes)) } as mode`);
  }
}

/**
 * Returns true if 'name' is a final state of 'instance' (FiniteStateObservable)
 */
export function IsFiniteStateObservableFinalState<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, name: string): boolean {
  return (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE].finalStates.has(name as TFinalState);
}

/**
 * Returns true if 'name' is a 'next' state
 */
export function IsFiniteStateObservableNextState(name: string): boolean {
  return (name === 'next');
}

/**
 * Returns true if 'mode' implies caching some per observer
 */
export function IsFiniteStateObservableCachingValuesPerObserverMode<TMode extends TFiniteStateObservableModeConstraint<TMode>>(mode: TMode): boolean {
  return (
    (mode === 'cache-per-observer')
    || (mode === 'cache-final-state-per-observer')
    || (mode === 'cache-all-per-observer')
  );
}

/**
 * Returns true if 'mode' implies caching some values
 */
export function IsFiniteStateObservableCachingValuesMode<TMode extends TFiniteStateObservableModeConstraint<TMode>>(mode: TMode): boolean {
  return (
    IsFiniteStateObservableCachingValuesPerObserverMode<TMode>(mode)
    || (mode === 'cache')
    || (mode === 'cache-final-state')
    || (mode === 'cache-all')
  );
}

/**
 * Returns true if 'instance' (FiniteStateObservable) mode implies caching some values
 */
export function IsFiniteStateObservableCachingValues<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): boolean {
  return IsFiniteStateObservableCachingValuesMode<TMode>((instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE].mode);
}


/**
 * Throws an error meaning than the FiniteStateObservable cannot emit a value because it is in a final state.
 */
export function ThrowFiniteStateObservableCannotEmitAfterFiniteState(state: string, notificationName: string): never {
  throw new Error(`Cannot emit a notification with the name '${ notificationName }' when the observable is in a final state '${ state }'`);
}

/**
 * This function must be called right before 'instance' (FiniteStateObservable) emits a data
 *  - it ensures a proper state
 *  - it ensures caching
 */
export function FiniteStateObservableOnEmit<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>, notification: KeyValueMapToNotifications<TKVMap>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE];
  const isFinalState: boolean = IsFiniteStateObservableFinalState<TValue, TFinalState, TMode, TKVMap>(instance, notification.name);

  if (isFinalState || IsFiniteStateObservableNextState(notification.name)) {
    if (privates.state === 'next') {
      if (
        (privates.mode === 'cache')
        || (privates.mode === 'cache-per-observer')
        || (privates.mode === 'cache-all')
        || (privates.mode === 'cache-all-per-observer')
        || (
          (
            (privates.mode === 'cache-final-state')
            || (privates.mode === 'cache-final-state-per-observer')
          )
          && isFinalState
        )
      ) {
        privates.values.push(notification);
      }

      if (isFinalState) {
        privates.state = notification.name as TFinalState;
      }
    } else {
      ThrowFiniteStateObservableCannotEmitAfterFiniteState(privates.state, notification.name);
    }
  } else {
    if (
      (privates.mode === 'cache-all')
      || (privates.mode === 'cache-all-per-observer')
    ) {
      privates.values.push(notification);
    }
  }
}

/**
 * Forces 'instance' (FiniteStateObservable) to clear its internal cache
 */
export function FiniteStateObservableClearCache<TValue,
  TFinalState extends TFinalStateConstraint<TFinalState>,
  TMode extends TFiniteStateObservableModeConstraint<TMode>,
  TKVMap extends TFiniteStateKeyValueMapConstraint<TValue, TFinalState, TKVMap>>(instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap>): void {
  const privates: IFiniteStateObservablePrivate<TValue, TFinalState, TMode, TKVMap> = (instance as IFiniteStateObservableInternal<TValue, TFinalState, TMode, TKVMap>)[FINITE_STATE_OBSERVABLE_PRIVATE];
  if (privates.state !== 'next') {
    throw new Error(`Clearing FiniteStateObservable's cache may only be performed when its state is 'next'`);
  } else if (instance.observed) {
    throw new Error(`Clearing FiniteStateObservable's cache may only be performed when it is not observed`);
  } else {
    privates.values = [];
  }
}
