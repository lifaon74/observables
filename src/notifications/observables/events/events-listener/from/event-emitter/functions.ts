import { IGenericEvent } from '../../event-like/generic/interfaces';
import { TNodeJSListenerValueToGenericEventValue } from './types';
import { GenericEvent } from '../../event-like/generic/implementation';

/**
 * FUNCTIONS
 */


export function NormalizeNodeJSListenerValue<T extends any[]>(args: T): TNodeJSListenerValueToGenericEventValue<T> {
  return (args.length === 0)
    ? void 0
    : (args.length === 1)
      ? args[0]
      : args;
}


export function NodeJSListenerValueToGenericEvent<T extends any[]>(type: string, args: T): IGenericEvent<TNodeJSListenerValueToGenericEventValue<T>> {
  return new GenericEvent<TNodeJSListenerValueToGenericEventValue<T>>(type, NormalizeNodeJSListenerValue<T>(args));
}
