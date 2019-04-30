import { TObject } from './types';

export type TUndefinedIfUnknown<T> = unknown extends T ? undefined : T;

export type PathOf<TInput, TKeysTuple extends PropertyKey[]> =
  TKeysTuple extends [] ? (
    TUndefinedIfUnknown<TInput>
    ) : (
    TKeysTuple extends [infer A] ? (
      TInput extends TObject ? (
        TUndefinedIfUnknown<TInput[A]>
        ): never
      ) : (
      TKeysTuple extends [infer A, infer B] ? (
        TInput extends TObject ? (
          TInput[A] extends TObject ? (
            TUndefinedIfUnknown<TInput[A][B]>
            ): never
          ): never
        ) : (
        TKeysTuple extends [infer A, infer B, infer C] ? (
          TInput extends TObject ? (
            TInput[A] extends TObject ? (
              TInput[A][B] extends TObject ? (
                TUndefinedIfUnknown<TInput[A][B][C]>
                ): never
              ): never
            ): never
          ) : (
          TKeysTuple extends [infer A, infer B, infer C, infer D] ? (
            TInput extends TObject ? (
              TInput[A] extends TObject ? (
                TInput[A][B] extends TObject ? (
                  TInput[A][B][C] extends TObject ? (
                    TUndefinedIfUnknown<TInput[A][B][C][D]>
                    ): never
                  ): never
                ): never
              ): never
            ) : (
            TKeysTuple extends [infer A, infer B, infer C, infer D, infer E] ? (
              TInput extends TObject ? (
                TInput[A] extends TObject ? (
                  TInput[A][B] extends TObject ? (
                    TInput[A][B][C] extends TObject ? (
                      TInput[A][B][C][D] extends TObject ? (
                        TUndefinedIfUnknown<TInput[A][B][C][D][E]>
                        ): never
                      ): never
                    ): never
                  ): never
                ): never
              ) : (
              TKeysTuple extends [infer A, infer B, infer C, infer D, infer E, infer F] ? (
                TInput extends TObject ? (
                  TInput[A] extends TObject ? (
                    TInput[A][B] extends TObject ? (
                      TInput[A][B][C] extends TObject ? (
                        TInput[A][B][C][D] extends TObject ? (
                          TInput[A][B][C][D][E] extends TObject ? (
                            TUndefinedIfUnknown<TInput[A][B][C][D][E][F]>
                            ): never
                          ): never
                        ): never
                      ): never
                    ): never
                  ): never
                ) : (
                TKeysTuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G] ? (
                  TInput extends TObject ? (
                    TInput[A] extends TObject ? (
                      TInput[A][B] extends TObject ? (
                        TInput[A][B][C] extends TObject ? (
                          TInput[A][B][C][D] extends TObject ? (
                            TInput[A][B][C][D][E] extends TObject ? (
                              TInput[A][B][C][D][E][F] extends TObject ? (
                                TUndefinedIfUnknown<TInput[A][B][C][D][E][F][G]>
                                ): never
                              ): never
                            ): never
                          ): never
                        ): never
                      ): never
                    ): never
                  ) : (
                  TKeysTuple extends [infer A, infer B, infer C, infer D, infer E, infer F, infer G, infer H] ? (
                    TInput extends TObject ? (
                      TInput[A] extends TObject ? (
                        TInput[A][B] extends TObject ? (
                          TInput[A][B][C] extends TObject ? (
                            TInput[A][B][C][D] extends TObject ? (
                              TInput[A][B][C][D][E] extends TObject ? (
                                TInput[A][B][C][D][E][F] extends TObject ? (
                                  TInput[A][B][C][D][E][F][G] extends TObject ? (
                                    TUndefinedIfUnknown<TInput[A][B][C][D][E][F][G][H]>
                                    ): never
                                  ): never
                                ): never
                              ): never
                            ): never
                          ): never
                        ): never
                      ): never
                    ) : (
                    never
                    )
                  )
                )
              )
            )
          )
        )
      )
    )
  ;

export function generatePathOfType(maxDepth: number = 8): string {
  const alphabet: string[] = Array.from({ length: 26 }, (_, index) => String.fromCodePoint(0x41 + index));
  const indent = (lines: string[]) => lines.map(line => ('  ' + line));

  const recursivePath = (maxDepth: number, depth: number = 0): string[] => {
    const types: string[] = alphabet.slice(0, depth);
    const path: string = types.map(_ => `[${_}]`).join('');

    return (depth >= maxDepth)
      ? [
        `TUndefinedIfUnknown<TInput${ path }>`
      ] : [
        `TInput${ path } extends TObject ? (`,
        ...indent(recursivePath(maxDepth, depth + 1)),
        `): never`
      ];
  };

  const recursive = (maxDepth: number, depth: number = 0): string[] => {
    const types: string[] = alphabet.slice(0, depth);

    const inferredTypes: string = types.map(type => `infer ${ type }`).join(', ');

    return (depth > maxDepth) ? ['never'] :  [
      `TKeysTuple extends [${ inferredTypes }] ? (`,
      ...indent(
        recursivePath(depth)
      ),
      `) : (`,
      ...indent(
        recursive(maxDepth, depth + 1)
      ),
      `)`,
    ];
  };

  return [
    `export type TUndefinedIfUnknown<T> = unknown extends T ? undefined : T;`,
    ``,
    `export type PathOf<TInput, TKeysTuple extends PropertyKey[]> =`,
    ...indent(recursive(maxDepth)),
    `;`,
  ].join('\n');
}

// console.log(generatePathOfType());

// type B = [1, 2];
// type C = [...B];
// const path1: PathOf<{ a: { b: 1 }}, []> = { a: { b: 1 }};
// const path2: PathOf<{ a: { b: 1 }}, ['a']> = { b: 1 };
// const path3: PathOf<{ a: { b: 1 }}, ['a', 'b']> = 1;
// const path4: PathOf<{ a: { b: 1 }}, ['c']> = undefined;
// const path5: PathOf<{ a: { b: 1 }}, ['a', 'c']> = undefined;
