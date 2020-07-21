var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
import createSagaMiddleware from "redux-saga";
import { fork, all } from "redux-saga/effects";
import { combineReducers, applyMiddleware, compose, createStore } from "redux";
import { logger } from "redux-logger";
var warning = require("warning");
var composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
var mpaInitModel = {
    namespace: "@@mpa",
    state: "@@mpa/state",
    reducer: {}
};
export default (function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.appReducer, appReducer = _c === void 0 ? {} : _c, _d = _b.middlewares, middlewares = _d === void 0 ? [] : _d, _e = _b.silence, silence = _e === void 0 ? false : _e;
    var _store;
    var _hasRun = false;
    var _actions = {};
    var _effect = [];
    var _listeners = [];
    var sagaMiddleware = createSagaMiddleware();
    var app = {
        get store() {
            return _store;
        },
        set store(S) {
            _store = S;
        },
        _models: [mpaInitModel],
        useModel: function () {
            var _a;
            var model = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                model[_i] = arguments[_i];
            }
            warning(!_hasRun, "You can't call 'useModel' after the app starts");
            (_a = app._models).push.apply(_a, model);
            return app;
        },
        actions: function (namespace) {
            warning(_hasRun, "You can't call 'actions' before the app starts");
            if (typeof namespace !== "undefined" && _actions[namespace]) {
                return _actions[namespace];
            }
            return _actions;
        },
        useListener: function (listener) {
            _listeners.push(listener);
            return _listeners.length - 1;
        },
        unuseListener: function (listenerHandle) {
            _listeners.splice(listenerHandle, 1);
        },
        injectEffect: function (effect) {
            sagaMiddleware.run(effect);
            return app;
        },
        run: run
    };
    return app;
    function run() {
        _hasRun = true;
        var store = create({
            appReducer: __assign(__assign({}, createReducers()), appReducer),
            middlewares: __spreadArrays(middlewares, [sagaMiddleware]),
            silence: silence
        });
        store.subscribe(function () {
            var currentState = store.getState();
            _listeners.forEach(function (listener) {
                listener(currentState);
            });
        });
        app.store = store;
        sagaMiddleware.run(createEffects());
        return app;
    }
    function createReducers() {
        return app._models.reduce(function (a, b) {
            a[b.namespace] = createReducerFunc(b);
            return a;
        }, {});
    }
    function createReducerFunc(model) {
        var reducer = model.reducer;
        var initState = model.state;
        var namespace = model.namespace;
        var reducerFunMap = Object.keys(reducer).reduce(function (a, b) {
            var _a;
            if (typeof _actions[namespace] === "undefined") {
                _actions[namespace] = {};
            }
            _actions[namespace] = __assign(__assign({}, _actions[namespace]), (_a = {}, _a[b] = actionWrapper(model.namespace + "/" + b), _a));
            a[namespace + "/" + b] = reducer[b];
            return a;
        }, {});
        return function (state, action) {
            if (state === void 0) { state = initState; }
            var type = action.type;
            if (reducerFunMap.hasOwnProperty(type)) {
                return reducerFunMap[action.type](state, action);
            }
            return state;
        };
    }
    function actionWrapper(type) {
        function actionCreator(payload, meta, error) {
            if (meta === void 0) { meta = null; }
            if (error === void 0) { error = null; }
            return {
                type: type,
                payload: payload,
                meta: meta,
                error: error
            };
        }
        actionCreator._toString = actionCreator.toString;
        actionCreator.toString = function () {
            return type;
        };
        return actionCreator;
    }
    function createEffects() {
        for (var _i = 0, _a = app._models; _i < _a.length; _i++) {
            var model = _a[_i];
            if (model.effect) {
                _effect.push(model.effect(app.actions(model.namespace), app.actions()));
            }
        }
        function errorWrapper(saga) {
            return function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            return [4, fork(saga)];
                        case 1:
                            _a.sent();
                            return [3, 3];
                        case 2:
                            error_1 = _a.sent();
                            console.log(error_1);
                            return [3, 3];
                        case 3: return [2];
                    }
                });
            };
        }
        return function rootSaga() {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, all(_effect.map(errorWrapper).map(fork))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        };
    }
    function create(_a) {
        var _b = _a.middlewares, middlewares = _b === void 0 ? [] : _b, appReducer = _a.appReducer, silence = _a.silence;
        if (process.env.NODE_ENV === "development" && !silence) {
            middlewares.push(logger);
        }
        return createStore(combineReducers(appReducer), composeEnhancers(applyMiddleware.apply(void 0, middlewares)));
        ;
    }
});
//# sourceMappingURL=mpa.js.map