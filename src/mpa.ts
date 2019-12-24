import { Model, App, Reducer, Action } from "./type";
import createSagaMiddleware, { Saga } from "redux-saga";
import { fork, all } from "redux-saga/effects";
import {
  combineReducers,
  applyMiddleware,
  compose,
  Store,
  createStore
} from "redux";
import { logger } from "redux-logger";
const warning = require("warning");
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__: any;
  }
}
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const mpaInitModel: Model = {
  namespace: "@@mpa",
  state: "@@mpa/state",
  reducer: {}
};

export default ({
  appReducer = {},
  middlewares = [],
  silence = false
}: {
  appReducer?: {
    [key: string]: Reducer;
  };
  middlewares?: Array<any>;
  silence?: boolean
} = {}): App => {
  let _store: Store;
  let _hasRun = false;
  const _actions: { [key: string]: any } = {};
  const _effect: Array<any> = [];
  const _listeners: Array<Function> = [];

  const sagaMiddleware = createSagaMiddleware();
  const app: App = {
    get store(): Store {
      return _store;
    },
    set store(S: Store) {
      _store = S;
    },
    _models: [mpaInitModel],
    useModel: (...model) => {
      warning(!_hasRun, "You can't call 'useModel' after the app starts");
      app._models.push(...model);
      return app;
    },
    actions: (namespace: string | undefined) => {
      warning(_hasRun, "You can't call 'actions' before the app starts");
      if (typeof namespace !== "undefined" && _actions[namespace]) {
        return _actions[namespace];
      }
      return _actions;
    },
    useListener: listener => {
      _listeners.push(listener);
      return _listeners.length - 1;
    },
    unuseListener: listenerHandle => {
      _listeners.splice(listenerHandle, 1);
    },
    injectEffect(effect: Saga) {
      sagaMiddleware.run(effect);
      return app;
    },
    run: run
  };
  return app;

  function run() {
    _hasRun = true;
    // 1.
    const store = create({
      appReducer: { ...createReducers(), ...appReducer },
      middlewares: [...middlewares, sagaMiddleware],
      silence

    });

    store.subscribe(() => {
      const currentState = store.getState();
      _listeners.forEach(listener => {
        listener(currentState);
      });
    });

    app.store = store;
    // 2.
    sagaMiddleware.run(createEffects());
    return app;
  }

  function createReducers() {
    return app._models.reduce((a: { [key: string]: any }, b: Model) => {
      a[b.namespace] = createReducerFunc(b);
      return a;
    }, {});
  }
  function createReducerFunc(model: Model) {
    const reducer = model.reducer;
    const initState = model.state;
    const namespace = model.namespace;
    // 创建 redux reducer
    const reducerFunMap: { [key: string]: Reducer } = Object.keys(
      reducer
    ).reduce((a: { [key: string]: any }, b) => {
      if (typeof _actions[namespace] === "undefined") {
        _actions[namespace] = {};
      }
      _actions[namespace] = {
        ..._actions[namespace],
        [b]: actionWrapper(`${model.namespace}/${b}`)
      };
      a[`${namespace}/${b}`] = reducer[b];
      return a;
    }, {});
    return (state: any = initState, action: Action) => {
      const type = action.type;
      if (reducerFunMap.hasOwnProperty(type)) {
        return reducerFunMap[action.type](state, action);
      }
      return state;
    };
  }

  function actionWrapper(type: string) {
    function actionCreator(payload: any,
      meta: any = null,
      error: any = null): { type: string;[key: string]: any } {
      return {
        type: type,
        payload,
        meta,
        error
      }
    }
    //重写toString
    actionCreator._toString = actionCreator.toString;

    actionCreator.toString = () => {
      return type;
    }
    return actionCreator
  }


  function createEffects() {
    for (const model of app._models) {
      if (model.effect) {
        _effect.push(model.effect(app.actions(model.namespace), app.actions()));
      }
    }

    function errorWrapper(saga) {
      return function* () {
        try {
          yield fork(saga)
        } catch (error) {
          console.log(error)
        }
      }
    }
    return function* rootSaga() {
      yield all(_effect.map(errorWrapper).map(fork));
    };
  }

  function create({
    middlewares = [],
    appReducer, silence
  }: {
    middlewares: Array<any>;
    appReducer: any;
    silence: boolean
  }): Store {
    if (process.env.NODE_ENV === "development" && !silence) {
      middlewares.push(logger);
    }


    return createStore(
      combineReducers(appReducer),
      composeEnhancers(applyMiddleware(...middlewares))
    );;
  }
};
