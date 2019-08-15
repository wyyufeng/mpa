import { App, Reducer, Action } from "./type";
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
    }
}
declare const _default: ({ appReducer, middlewares }?: {
    appReducer?: {
        [key: string]: Reducer<any, Action>;
    };
    middlewares?: any[];
}) => App;
export default _default;
