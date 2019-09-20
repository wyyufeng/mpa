import { App, Reducer, Action } from "./type";
declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
    }
}
declare const _default: ({ appReducer, middlewares, silence }?: {
    appReducer?: {
        [key: string]: Reducer<any, Action>;
    };
    middlewares?: any[];
    silence?: boolean;
}) => App;
export default _default;
