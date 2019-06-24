import { IInstance } from '../../interfaces';

export interface ISuper<TInstance extends Object, TConstructor extends Function> extends IInstance<TInstance, TConstructor> {

}
