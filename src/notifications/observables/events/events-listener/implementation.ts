import { IEventsListener } from './interfaces';
import { ConstructEventsListener } from './constructor';

/**
 * ABSTRACT CLASS
 */

export abstract class EventsListener implements IEventsListener {

  protected constructor() {
    ConstructEventsListener(this);
  }

  abstract addEventListener(event: string, listener: (...args: any[]) => void): void;

  abstract removeEventListener(event: string, listener: (...args: any[]) => void): void;
}

