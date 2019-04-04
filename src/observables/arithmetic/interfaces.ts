import { IObservable } from '../../core/observable/interfaces';
import { IReadonlyList } from '../../misc/readonly-list/interfaces';

export interface IArithmeticAdditionObservable extends IObservable<number> {
  readonly observables: IReadonlyList<IObservable<number>>;
}

export interface IArithmeticAddObservable extends IArithmeticAdditionObservable {
}

export interface IArithmeticSubtractObservable extends IArithmeticAdditionObservable {
}


export interface IArithmeticDivideObservable extends IObservable<number> {
  readonly observables: IReadonlyList<IObservable<number>>;
}

// dividend or numerator over the divisor or denominator