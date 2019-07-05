import { IObservableContext } from '../../core/observable/interfaces';
import { periodTime } from '../../classes/pure-pipes';
import { Observable } from '../../core/observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IDOMChangeObservable } from './interfaces';
import { IsObject } from '../../helpers';


export const DOM_CHANGE_OBSERVABLE_PRIVATE = Symbol('dom-change-observable-private');

export interface IDOMChangeObservablePrivate {
  observer: MutationObserver;
}

export interface IDOMChangeObservableInternal extends IDOMChangeObservable {
  [DOM_CHANGE_OBSERVABLE_PRIVATE]: IDOMChangeObservablePrivate;
}


export function ConstructDOMChangeObservable(observable: IDOMChangeObservable, context: IObservableContext<void>): void {
  ConstructClassWithPrivateMembers(observable, DOM_CHANGE_OBSERVABLE_PRIVATE);

  (observable as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE].observer = new MutationObserver(periodTime(() => {
    context.emit();
  }, 300));
}


export function IsDOMChangeObservable(value: any): value is IDOMChangeObservable {
  return IsObject(value)
    && value.hasOwnProperty(DOM_CHANGE_OBSERVABLE_PRIVATE);
}

export function DOMChangeObservableOnObserved(observable: IDOMChangeObservable): void {
  if (observable.observers.length === 1) {
    (observable as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE].observer.observe(document, {
      childList: true,
      subtree: true
    });
  }
}

export function DOMChangeObservableOnUnobserved(observable: IDOMChangeObservable): void {
  if (!observable.observed) {
    (observable as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE].observer.disconnect();
  }
}


export class DOMChangeObservable extends Observable<void> implements IDOMChangeObservable {
  constructor() {
    let context: IObservableContext<void>;
    super((_context: IObservableContext<void>) => {
      context = _context;
      return {
        onObserved: () => {
          DOMChangeObservableOnObserved(this);
        },
        onUnobserved: () => {
          DOMChangeObservableOnUnobserved(this);
        }
      };
    });
    // @ts-ignore
    ConstructDOMChangeObservable(this, context);
  }
}
