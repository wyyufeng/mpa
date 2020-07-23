import { Store, Reducer, Dispatch } from "redux";
export { Reducer } from 'redux';
export type mpaOptions = {
  appReducer?: {
    [key: string]: Reducer,
  },
  middlewares?: Array<any>;
  silence?: boolean
}
export type Model = {
  namespace: string;
  state: any;
  reducer: ReducerMap;
  effect?: Function;
}

export interface Action {
  type: string;
  payload: any;
  meta: any;
  error: any;
  [key: string]: any;
}
export type ActionCreatore<> = (...args: any[]) => Action;

export interface Actions {
  [key: string]: ActionCreatore | Action;
}


export interface ReducerMap {
  [actionType: string]: Reducer;
}

export interface UseModal {
  (...models: Array<Model>): App;
}

export interface App {
  store: Store | null;
  actions: Function;
  _models: Array<Model>;
  useModel: UseModal
  run: () => App;
  dispatch: Dispatch

}
