import {
  IFiniteStateObservable, IFiniteStateObservableContext, TFiniteStateObservableCreateCallback,
  TFiniteStateObservableFinalState, TFiniteStateObservableMode
} from '../../interfaces';
import { Observable as RXObservable, Subscription as RXSubscription } from 'rxjs';
import { setImmediate } from '../../../../../classes/set-immediate';
import { UntilDefined } from '../../../../../helpers';
import { FromRXJSObservableKeyValueMap, TFromRXJSObservableFinalState } from './interfaces';


/**
 * Ensures a proper unsubscribe of the RXJS's Subscription
 * @param rxSubscriptionCallback
 * @param count
 */
export function UnsubscribeRXJSSubscription(rxSubscriptionCallback: () => (RXSubscription | undefined), count: number = 1): void {
  if (count >= 0) {
    const rxSubscription: RXSubscription | undefined = rxSubscriptionCallback();
    if (rxSubscription === void 0) { // may append if rxObservable is complete before rxSubscription is set
      // in this case, delay the executing until rxSubscription exists
      setImmediate(() => {
        UnsubscribeRXJSSubscription(rxSubscriptionCallback, count - 1);
      });
    } else {
      rxSubscription.unsubscribe();
    }
  }
}

/**
 * Generates an Hook for a FiniteStateObservable, based on an RXJS's Observable:
 *  - when the Observable is freshly observed, creates a Subscription from 'rxObservable'
 *  - relays 'next', 'error' and 'complete' functions as Notifications
 *  - if the FiniteStateObservable is no more observed, unsubscribe the Subscription
 * @param rxObservable
 */
export function GenerateFiniteStateObservableHookFromRXJS<TValue>(
  rxObservable: RXObservable<TValue>,
): TFiniteStateObservableCreateCallback<TValue, TFromRXJSObservableFinalState, TFiniteStateObservableMode, FromRXJSObservableKeyValueMap<TValue>> {
  type TFinalState = TFiniteStateObservableFinalState;
  type TMode = TFiniteStateObservableMode;
  type TKVMap = FromRXJSObservableKeyValueMap<TValue>;
  return function (context: IFiniteStateObservableContext<TValue, TFinalState, TMode, TKVMap>) {
    let rxSubscription: RXSubscription | undefined;

    function clearSubscription() {
      UntilDefined<RXSubscription>(() => rxSubscription, () => {
        rxSubscription = void 0;
      }, 1);
    }

    return {
      onObserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (rxSubscription === void 0)
          && (instance.observers.length === 1) // optional check
          && (instance.state === 'next') // optional check
        ) {
          rxSubscription = rxObservable
            .subscribe(
              (value: TValue) => {
                context.next(value);
              },
              (error: any) => {
                clearSubscription();
                context.error(error);
              },
              () => {
                clearSubscription();
                context.complete();
              });
        }
      },
      onUnobserved(): void {
        const instance: IFiniteStateObservable<TValue, TFinalState, TMode, TKVMap> = this;
        if (
          (!instance.observed)
          && (instance.state === 'next')
        ) {
          // INFO state if not complete, maybe clear the cache
          clearSubscription();
        }
      },
    };
  };
}

