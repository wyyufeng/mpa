import { mpaOptions, Model, App, Reducer, Action } from "./type";
import createSagaMiddleware, { SagaMiddleware } from "redux-saga";
import { Store, Dispatch, createStore, combineReducers, AnyAction, applyMiddleware, compose } from 'redux';
import { all, fork, put } from 'redux-saga/effects'
import { createLogger } from "redux-logger";


// 默认model
const mpaInitModel: Model = {
    namespace: "@@mpa",
    state: "@@mpa/running",
    reducer: {
        throwError() {
            return "@@mpa/broken"
        }
    }
};
declare var window: any;
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 }) || compose;
const mpa = (options: mpaOptions = {}): App => {
    const sagaMiddleware: SagaMiddleware = createSagaMiddleware();
    const { appReducer = {}, middlewares = [], silence = false } = options
    let _store: Store | null = null;
    const _actionsMap: { [key: string]: any } = {};
    const _effectsMap: Array<any> = [];
    const core = {
        get store() {
            return _store
        },
        set store(store) {
            _store = store;
        },
        get dispatch(): Dispatch {
            const store = core.store as Store;
            return store.dispatch
        },
        _models: [mpaInitModel],
        actions(namespace?: string | undefined) {
            if (typeof namespace === 'undefined') {
                return _actionsMap
            }
            return _actionsMap[namespace]
        },
        useModel(...models: Array<Model>) {
            core._models.push(...models);
            return core;
        }, run: run
    }
    return core;
    // for internal
    function createReducers() {
        return core._models.reduce((a: { [key: string]: Reducer }, b: Model) => {
            a[b.namespace] = createReducerFunc(b);
            return a;
        }, {});
    }
    function createReducerFunc(model: Model): Reducer {
        const reducer = model.reducer;
        const initState = model.state;
        const namespace = model.namespace;
        // 类似于reducer中switch的作用
        const reducerFunMap: { [key: string]: Reducer } = Object.keys(
            reducer
        ).reduce((a: { [key: string]: Reducer }, b: string) => {
            const actionType = `${namespace}/${b}`
            a[actionType] = reducer[b];
            if (typeof _actionsMap[namespace] === "undefined") {
                _actionsMap[namespace] = {};
            }
            _actionsMap[namespace] = {
                ..._actionsMap[namespace],
                [b]: createActionCreater(actionType)
            }
            return a;
        }, {});
        // 返回redux需要的reducer函数
        return (state: any = initState, action: AnyAction | Action) => {
            const type = action.type;
            if (reducerFunMap.hasOwnProperty(type)) {
                return reducerFunMap[type](state, action);
            }
            return state;
        };
    }
    function createActionCreater(type: string) {
        function _actionCreater(payload: any, meta: any, error: any) {
            return {
                type: type, payload, meta, error
            }
        }
        // overwrite toString
        _actionCreater._toString = _actionCreater.toString;

        _actionCreater.toString = () => {
            return type;
        }
        return _actionCreater
    }

    function createEffects() {
        for (const model of core._models) {
            if (model.effect) {
                const _effect = model.effect(core.actions(model.namespace), core.actions());
                _effect.namespace = model.namespace;

                _effectsMap.push(_effect);
            }
        }
        function errorWrapper(saga: any) {
            return function* () {
                try {
                    yield fork(saga)
                } catch (error) {
                    yield put(core.actions('@@mpa').throwError)
                    console.log(`[model: ${saga.namespace}]- mpa has caught an error when running effect`)
                    console.log(error)
                }
            }
        }
        return function* rootSaga() {
            yield all(_effectsMap.map(errorWrapper).map(fork));
        };
    }

    // for out
    function run() {
        const _reduxMiddlewares = middlewares;

        if (process.env.NODE_ENV === "development" && !silence) {
            _reduxMiddlewares.push(createLogger({ collapsed: true, diff: true }));
        }
        _reduxMiddlewares.unshift(sagaMiddleware);
        const _reduxReducers = { ...createReducers(), ...appReducer };
        const _reduxStore = createStore(combineReducers(_reduxReducers), composeEnhancers(applyMiddleware(..._reduxMiddlewares)));
        sagaMiddleware.run(createEffects());
        core.store = _reduxStore;
        return core
    }
}

export default mpa