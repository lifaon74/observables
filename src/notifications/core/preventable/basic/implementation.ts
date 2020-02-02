import { IBasicPreventable } from './interfaces';
import { Preventable } from '../implementation';


/** CLASS **/

export class BasicPreventable extends Preventable<'default'> implements IBasicPreventable {

  constructor() {
    super();
  }

  isPrevented(): boolean {
    return super.isPrevented('default');
  }

  prevent(): this {
    return super.prevent('default');
  }
}

