/**
 * TYPES
 */

export type PureEventTarget =
  Pick<EventTarget, 'addEventListener' | 'removeEventListener'>
  & Partial<Pick<EventTarget, 'dispatchEvent'>>;
