import { Instance } from '../../implementation';

export class Super<TInstance extends Object, TConstructor extends Function> extends Instance<TInstance, TConstructor> {
  constructor(instance: TInstance, _constructor?: TConstructor) {
    let __constructor: TConstructor;
    if (_constructor === void 0) {
      __constructor = Object.getPrototypeOf(instance.constructor);
    } else if ((instance instanceof _constructor) && (_constructor === instance.constructor)) {
      __constructor = _constructor;
    } else {
      // throw new Error(`The class has not been extended by ${ _constructor.name }`);
      throw new Error(`${ _constructor.name } is not a super of the provided instance ${ instance.constructor.name }`);
    }

    super(instance, __constructor);
  }
}
