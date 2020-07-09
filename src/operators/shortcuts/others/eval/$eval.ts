import { TObservableOrValue } from '../../types';
import { IFunctionObservable } from '../../../../observables/distinct/function-observable/sync/interfaces';
import { FunctionObservable } from '../../../../observables/distinct/function-observable/sync/implementation';
import { $observables } from '../../primitives/$observables';
import { LoadJSParser, TParseFunction } from './ast/parser';
import { IObservable } from '../../../../core/observable/interfaces';
import { IObservableContext } from '../../../../core/observable/context/interfaces';
import { Observable } from '../../../../core/observable/implementation';
import { ObservableIsFreshlyObserved, ObservableIsNotObserved } from '../../../../core/observable/functions';
import { ASTToObservable } from './ast/ast-to-observable';
import { IObserver } from '../../../../core/observer/interfaces';
import { Observer } from '../../../../core/observer/public';

/**
 * Returns a FunctionObservable which changes when the <evaluation> of the template string changes
 * Use the <evil> 'eval' function
 */
export function $evalUnsafe<T>(parts: TemplateStringsArray | string[], ...args: TObservableOrValue<any>[]): IFunctionObservable<(...values: any[]) => T> {
  const lengthMinusOne: number = parts.length - 1;
  return new FunctionObservable((...values: any[]) => {
    let str: string = '';
    for (let i = 0; i < lengthMinusOne; i++) {
      str += parts[i] + values[i];
    }
    return eval(str + parts[lengthMinusOne]);
  }, $observables(...args));
}


export function EvalTemplateStringToObservable(parts: TemplateStringsArray | string[], args: TObservableOrValue<any>[]): Promise<IObservable<any>> {
  return LoadJSParser()
    .then((parse: TParseFunction) => {
      const lengthMinusOne: number = parts.length - 1;
      const identifierToValueMap = new Map<string, any>();
      let code: string = '';
      for (let i = 0; i < lengthMinusOne; i++) {
        const identifier: string = `value${ i }`;
        code += parts[i] + identifier;
        identifierToValueMap.set(identifier, args[i]);
      }

      const ast = parse(code);
      // console.log(ast);

      return ASTToObservable(ast, (identifier: string) => {
        if (identifierToValueMap.has(identifier)) {
          return identifierToValueMap.get(identifier) as any;
        } else {
          throw new Error(`Unknown identifier: ${ identifier }`);
        }
      });
    });
}


/**
 * Returns an Observable which changes when the <evaluation> of the template string changes
 * Uses a JS parser, to <eval> on a safe context (at the price of parser scripts download)
 */
export function $eval<T = any>(parts: TemplateStringsArray | string[], ...args: TObservableOrValue<any>[]): IObservable<T> {
  return new Observable<T>((context: IObservableContext<T>) => {
    let observablePromise: Promise<any>;
    const observer: IObserver<T> = new Observer<T>((value: T) => {
      context.emit(value);
    });
    return {
      onObserved() {
        if (observablePromise === void 0) {
          observablePromise = EvalTemplateStringToObservable(parts, args)
            .then((observable: IObservable<any>) => {
              observer.observe(observable);
            });
        }
        if (ObservableIsFreshlyObserved(context.observable)) {
          observer.activate();
        }
      },
      onUnobserved() {
        if (ObservableIsNotObserved(context.observable)) {
          observer.deactivate();
        }
      }
    };
  });
}
