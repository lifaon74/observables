import { IPromiseConstructor } from './promise';


export const $Promise: IPromiseConstructor = Promise as unknown as IPromiseConstructor;


// const a = new $Promise<'a'>(() => {});


