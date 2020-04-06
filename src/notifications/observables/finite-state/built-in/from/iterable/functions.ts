import { IsObject } from '../../../../../../helpers';
import { IFromIterableObservableOptions} from './types';
import { TSyncOrAsyncIterable } from '../../../../../../misc/helpers/iterators/interfaces';
import { IsIterable } from '../../../../../../misc/helpers/iterators/is/is-iterable';
import { IsAsyncIterable } from '../../../../../../misc/helpers/iterators/is/is-async-iterable';

/** FUNCTIONS **/

export interface IFromIterableObservableNormalizedOptions extends IFromIterableObservableOptions {
  isAsync: boolean;
}

export interface IFromIterableObservableNormalizedArguments<TIterable extends TSyncOrAsyncIterable<any>> extends IFromIterableObservableNormalizedOptions {
  iterable: TIterable;
}

export function NormalizeFromIterableObservableOptionsAndIterable<TIterable extends TSyncOrAsyncIterable<any>>(iterable: TIterable, options: IFromIterableObservableOptions = {}): IFromIterableObservableNormalizedArguments<TIterable> {
  const args: IFromIterableObservableNormalizedArguments<TIterable> = {
    iterable,
    ...options
  } as IFromIterableObservableNormalizedArguments<TIterable>;

  const isIterable: boolean = IsIterable(iterable);
  const isAsyncIterable: boolean = IsAsyncIterable(iterable);

  if (isAsyncIterable || isIterable) {
    args.iterable = iterable;

    if (IsObject(options)) {
      if (options.isAsync === void 0) {
        args.isAsync = isAsyncIterable;
      } else if (typeof options.isAsync === 'boolean') {
        if (options.isAsync && !isAsyncIterable) {
          throw new Error(`options.isAsync is true but the provided iterable is not an AsyncIterable`);
        } else {
          args.isAsync = options.isAsync;
        }
      } else {
        throw new TypeError(`Expected boolean or void as FromIterableObservable.options.isAsync`);
      }
    } else {
      throw new TypeError(`Expected object or void as options`);
    }
  } else {
    throw new TypeError(`Expected Iterable or AsyncIterable as iterable`);
  }

  return args;
}
