import { Reason } from '../reason/implementation';

export class AbortReason extends Reason<'ABORT'> {
  static discard(reason: any): void | never {
    if (!(reason instanceof AbortReason)) {
      throw reason;
    }
  }

  constructor(message: string = 'Aborted') {
    super(message, 'ABORT');
  }
}
