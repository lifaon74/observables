import { LoadJSParser } from '../../../../operators/shortcuts/others/eval/ast/parser';
import { $eval } from '../../../../operators/shortcuts/others/eval/$eval';
import { Source } from '../../../../observables/distinct/source/sync/implementation';
import { ASTToObservable } from '../../../../operators/shortcuts/others/eval/ast/ast-to-observable';
import { $observable } from '../../../../operators/shortcuts/primitives/$observable';


export async function debugEvalShortcutOperatorParser() {
  console.log('debugEvalShortcutOperatorParser');

  // const code = '(a + b) * 5 - c / d';
  // const code = '(a && b) || c';
  // const code = '!a';
  // const code = 'a === b';
  const code = 'a !== b';

  const parse = await LoadJSParser();
  const ast = parse(code);
  console.log(ast);

  console.log(ASTToObservable(ast, () => null as any));
}

export async function debugEvalShortcutOperator() {
  const a = new Source().emit(5);
  const observable = $eval`(${ a } + 2) < ${ $observable(5) } + ${ 3 }`;

  observable.pipeTo((value) => {
    console.log('output:', value);
  }).activate();

  (window as any).a = a;
}


export async function debugShortcutOperators() {
  // await debugEvalShortcutOperatorParser();
  await debugEvalShortcutOperator();
}
