import { IPromiseObservableOptions, TPromiseObservableMode } from './types';
import { IsObject } from '../../../../../../helpers';
import { GetFiniteStateObservableDefaultModes } from '../../../functions';

/** FUNCTIONS **/

export interface IPromiseObservableOptionsStrict extends IPromiseObservableOptions {
  modes: Set<TPromiseObservableMode>;
}

export function NormalizePromiseObservableOptions(options: IPromiseObservableOptions = {}): IPromiseObservableOptionsStrict {
  if (IsObject(options)) {
    const modes: Set<TPromiseObservableMode> = GetFiniteStateObservableDefaultModes();
    modes.add('every');
    return Object.assign({}, options, {
      modes: modes,
    });
  } else {
    throw new TypeError(`Expected object or void as PromiseObservable.options`);
  }
}
