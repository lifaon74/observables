import { IDOMResizeObservable, IDOMResizeObservableOptions } from './interfaces';
import { ResizeObserver, ResizeObserverObserveOptions } from './ResizeObserver'; // TODO fix in the future when definition will exists
import { IObservableContext } from '../../core/observable/context/interfaces';
import { IsObject } from '../../helpers';
import { periodTime } from '../../classes/pure-pipes';
import { Observable } from '../../core/observable/implementation';
import { ConstructClassWithPrivateMembers } from '@lifaon/class-factory';


/** PRIVATES **/

export const DOM_RESIZE_OBSERVABLE_PRIVATE = Symbol('dom-resize-observable-private');

export interface IDOMResizeObservablePrivate {
  observer: ResizeObserver;
  element: Element;
  options: ResizeObserverObserveOptions;
  maxRefreshPeriod: number;
}

export interface IDOMResizeObservablePrivatesInternal {
  [DOM_RESIZE_OBSERVABLE_PRIVATE]: IDOMResizeObservablePrivate;
}

export interface IDOMResizeObservableInternal extends IDOMResizeObservablePrivatesInternal, IDOMResizeObservable {
}

/** CONSTRUCTOR **/

export function ConstructDOMResizeObservable(
  instance: IDOMResizeObservable,
  context: IObservableContext<void>,
  element: Element,
  options?: IDOMResizeObservableOptions
): void {
  ConstructClassWithPrivateMembers(instance, DOM_RESIZE_OBSERVABLE_PRIVATE);
  const privates: IDOMResizeObservablePrivate = (instance as IDOMResizeObservableInternal)[DOM_RESIZE_OBSERVABLE_PRIVATE];

  if (element instanceof Element) {
    privates.element = element;
  } else {
    throw new TypeError(`Expected Element as DOMResizeObservable.element`);
  }

  if (options === void 0) {
    privates.options = {
      box: 'content-box',
    };
    privates.maxRefreshPeriod = 300;
  } else if (IsObject(options)) {
    privates.options = { ...options };

    if (options.maxRefreshPeriod === void 0) {
      privates.maxRefreshPeriod = 300;
    } else if ((typeof options.maxRefreshPeriod === 'number') && (options.maxRefreshPeriod >= 0) && Number.isFinite(options.maxRefreshPeriod)) {
      privates.maxRefreshPeriod = options.maxRefreshPeriod;
    } else {
      throw new TypeError(`Expected number in the range [0, +Infinity[ or undefined as DOMResizeObservable.options.maxRefreshPeriod`);
    }

  } else {
    throw new TypeError(`Expected MutationObserverInit or void as DOMResizeObservable.options`);
  }


  const emit = () => {
    context.emit();
  };

  privates.observer = new ResizeObserver(
    (privates.maxRefreshPeriod === 0)
      ? emit
      : periodTime(emit, privates.maxRefreshPeriod)
  );
}


export function IsDOMResizeObservable(value: any): value is IDOMResizeObservable {
  return IsObject(value)
    && value.hasOwnProperty(DOM_RESIZE_OBSERVABLE_PRIVATE as symbol);
}

/** CONSTRUCTOR FUNCTIONS **/

export function DOMResizeObservableOnObserved(instance: IDOMResizeObservable): void {
  if (instance.observers.length === 1) {
    const privates: IDOMResizeObservablePrivate = (instance as IDOMResizeObservableInternal)[DOM_RESIZE_OBSERVABLE_PRIVATE];
    privates.observer.observe(privates.element, privates.options);
  }
}

export function DOMResizeObservableOnUnobserved(instance: IDOMResizeObservable): void {
  if (!instance.observed) {
    (instance as IDOMResizeObservableInternal)[DOM_RESIZE_OBSERVABLE_PRIVATE].observer.disconnect();
  }
}

/** CLASS **/

export class DOMResizeObservable extends Observable<void> implements IDOMResizeObservable {
  constructor(element: Element, options?: IDOMResizeObservableOptions) {
    let context: IObservableContext<void>;
    super((_context: IObservableContext<void>) => {
      context = _context;
      return {
        onObserved: () => {
          DOMResizeObservableOnObserved(this);
        },
        onUnobserved: () => {
          DOMResizeObservableOnUnobserved(this);
        }
      };
    });
    // @ts-ignore
    ConstructDOMResizeObservable(this, context, element, options);
  }
}
