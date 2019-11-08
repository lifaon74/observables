import {
  ADVANCED_ABORT_CONTROLLER_PRIVATE, IAdvancedAbortControllerInternal, IAdvancedAbortControllerPrivate
} from './privates';
import { IAdvancedAbortController } from './interfaces';
import { ConstructClassWithPrivateMembers } from '../helpers/ClassWithPrivateMembers';
import { IsObject } from '../../helpers';
import { NewAdvancedAbortSignal } from './advanced-abort-signal/implementation';

/** CONSTRUCTOR **/

export function ConstructAdvancedAbortController(instance: IAdvancedAbortController): void {
  ConstructClassWithPrivateMembers(instance, ADVANCED_ABORT_CONTROLLER_PRIVATE);
  const privates: IAdvancedAbortControllerPrivate = (instance as IAdvancedAbortControllerInternal)[ADVANCED_ABORT_CONTROLLER_PRIVATE];
  privates.signal = NewAdvancedAbortSignal();
}

export function IsAdvancedAbortController(value: any): value is IAdvancedAbortController {
  return IsObject(value)
    && (value.hasOwnProperty(ADVANCED_ABORT_CONTROLLER_PRIVATE as symbol));
}
