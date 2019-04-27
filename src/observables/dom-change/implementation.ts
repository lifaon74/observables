import { IObservableContext } from '../../core/observable/interfaces';
import { periodTime } from '../../classes/pure-pipes';
import { Observable } from '../../core/observable/implementation';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IDOMChangeObservable } from './interfaces';
import { IsObject } from '../../helpers';


export const DOM_CHANGE_PRIVATE = Symbol('dom-change-private');

export interface IDOMChangePrivate {
  observer: MutationObserver;
}

export interface IDOMChangeInternal extends IDOMChangeObservable {
  [DOM_CHANGE_PRIVATE]: IDOMChangePrivate;
}


export function ConstructDOMChangeObservable(observable: IDOMChangeObservable, context: IObservableContext<void>): void {
  ConstructClassWithPrivateMembers(observable, DOM_CHANGE_PRIVATE);

  (observable as IDOMChangeInternal)[DOM_CHANGE_PRIVATE].observer = new MutationObserver(periodTime(() => {
    context.emit();
  }, 300));
}


export function IsDOMChangeObservable(value: any): value is IDOMChangeObservable {
  return IsObject(value)
    && value.hasOwnProperty(DOM_CHANGE_PRIVATE);
}

export function DOMChangeObservableOnObserved(observable: DOMChangeObservable): void {
  if (observable.observers.length === 1) {
    (observable as IDOMChangeInternal)[DOM_CHANGE_PRIVATE].observer.observe(document, {
      childList: true,
      subtree: true
    });
  }
}

export function DOMChangeObservableOnUnobserved(observable: DOMChangeObservable): void {
  if (!observable.observed) {
    (observable as IDOMChangeInternal)[DOM_CHANGE_PRIVATE].observer.disconnect();
  }
}


export class DOMChangeObservable extends Observable<void> implements IDOMChangeObservable {
  constructor() {
    let context: IObservableContext<void> = void 0;
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
    ConstructDOMChangeObservable(this, context);
  }
}
