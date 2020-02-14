import { periodTime } from '../../classes/pure-pipes';
import { ConstructClassWithPrivateMembers } from '../../misc/helpers/ClassWithPrivateMembers';
import { IDOMChangeObservable, IDOMChangeObservableOptions } from './interfaces';
import { IsObject } from '../../helpers';
import { Observable } from '../../core/observable/implementation';
import { IObservableContext } from '../../core/observable/context/interfaces';

/** PRIVATES **/

export const DOM_CHANGE_OBSERVABLE_PRIVATE = Symbol('dom-change-observable-private');

export interface IDOMChangeObservablePrivate {
  observer: MutationObserver;
  node: Node;
  options: MutationObserverInit;
  maxRefreshPeriod: number;
}

export interface IDOMChangeObservablePrivatesInternal {
  [DOM_CHANGE_OBSERVABLE_PRIVATE]: IDOMChangeObservablePrivate;
}

export interface IDOMChangeObservableInternal extends IDOMChangeObservablePrivatesInternal, IDOMChangeObservable {
}

/** CONSTRUCTOR **/

export function ConstructDOMChangeObservable(
  instance: IDOMChangeObservable,
  context: IObservableContext<void>,
  node?: Node,
  options?: IDOMChangeObservableOptions
): void {
  ConstructClassWithPrivateMembers(instance, DOM_CHANGE_OBSERVABLE_PRIVATE);
  const privates: IDOMChangeObservablePrivate = (instance as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE];

  if (node === void 0) {
    privates.node = document;
  } else if (node instanceof Node) {
    privates.node = node;
  } else {
    throw new TypeError(`Expected node or void as DOMChangeObservable.node`);
  }

  if (options === void 0) {
    privates.options = {
      childList: true,
      subtree: true,
      attributes: true,
    };
    privates.maxRefreshPeriod = 300;
  } else if (IsObject(options)) {
    privates.options = { ...options };

    if (options.maxRefreshPeriod === void 0) {
      privates.maxRefreshPeriod = 300;
    } else if ((typeof options.maxRefreshPeriod === 'number') && (options.maxRefreshPeriod >= 0) && Number.isFinite(options.maxRefreshPeriod)) {
      privates.maxRefreshPeriod = options.maxRefreshPeriod;
    } else {
      throw new TypeError(`Expected number in the range [0, +Infinity[ or undefined as DOMChangeObservable.options.maxRefreshPeriod`);
    }

  } else {
    throw new TypeError(`Expected MutationObserverInit or void as DOMChangeObservable.options`);
  }


  const emit = () => {
    context.emit();
  };

  privates.observer = new MutationObserver(
    (privates.maxRefreshPeriod === 0)
      ? emit
      : periodTime(emit, privates.maxRefreshPeriod)
  );
}


export function IsDOMChangeObservable(value: any): value is IDOMChangeObservable {
  return IsObject(value)
    && value.hasOwnProperty(DOM_CHANGE_OBSERVABLE_PRIVATE as symbol);
}

/** CONSTRUCTOR FUNCTIONS **/

export function DOMChangeObservableOnObserved(instance: IDOMChangeObservable): void {
  if (instance.observers.length === 1) {
    const privates: IDOMChangeObservablePrivate = (instance as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE];
    privates.observer.observe(privates.node, privates.options);
  }
}

export function DOMChangeObservableOnUnobserved(instance: IDOMChangeObservable): void {
  if (!instance.observed) {
    (instance as IDOMChangeObservableInternal)[DOM_CHANGE_OBSERVABLE_PRIVATE].observer.disconnect();
  }
}

/** CLASS **/

export class DOMChangeObservable extends Observable<void> implements IDOMChangeObservable {
  constructor(node?: Node, options?: IDOMChangeObservableOptions) {
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
    ConstructDOMChangeObservable(this, context, node, options);
  }
}
