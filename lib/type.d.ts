import { Saga } from "redux-saga";
import { Store } from "redux";
export interface Action {
  type: string;
  payload?: any;
  meta?: any;
  error?: any;
}
export declare type ActionCreatore = (...args: any[]) => Action;
export interface Actions {
  [key: string]: ActionCreatore | Action;
}
export declare type Reducer<S = any, A = Action> = (
  state: S | undefined,
  action: A
) => S;
export interface ReducerMap {
  [actionType: string]: Reducer;
}
export interface Model {
  namespace: string;
  state: any;
  reducer: ReducerMap;
  effect?: Function;
}
export interface App {
  store: Store;
  actions: Function;
  _models: Array<Model>;
  useModel: (model: Model) => App;
  run: () => App;
  useListener: (state: any) => number;
  unuseListener: (index: number) => void;
  injectEffect: (effect: Saga) => App;
}
