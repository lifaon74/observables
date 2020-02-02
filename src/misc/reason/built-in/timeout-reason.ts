import { Reason } from '../implementation';

export class TimeoutReason extends Reason<'TIMEOUT'> {
  static discard(reason: any): void | never {
    if (!(reason instanceof TimeoutReason)) {
      throw reason;
    }
  }

  constructor(message: string = 'Timeout reached') {
    super(message, 'TIMEOUT');
  }
}
