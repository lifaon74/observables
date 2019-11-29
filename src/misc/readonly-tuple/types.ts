/** TYPES **/

// returns the union of the types available in a tuple
export type TupleTypes<TTuple extends any[]> = { [P in keyof TTuple]: TTuple[P] } extends { [key: number]: infer V } ? V : never;
