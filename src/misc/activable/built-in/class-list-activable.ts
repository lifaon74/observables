import { Activable } from '../implementation';
import { TNativePromiseLikeOrValue } from '../../../promises/types/native';

/**
 * Activable for a list of classes on a element.
 * - activate: adds the classes to the element
 * - deactivate: removes the classes from the element
 */
export class ClassListActivable extends Activable {
  protected _target: Element;
  protected _classNames: string[];


  constructor(target: Element, classNames: Iterable<string>) {
    super({
      activate: (): TNativePromiseLikeOrValue<void> => {
        this._target.classList.add(...this._classNames);
      },
      deactivate: (): TNativePromiseLikeOrValue<void> => {
        this._target.classList.remove(...this._classNames);
      }
    });
    this._target = target;
    this._classNames = Array.from(classNames);
  }
}
