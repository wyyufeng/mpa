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
import createSagaMiddleware from "redux-saga";
import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { all, fork, put } from 'redux-saga/effects';
import { createLogger } from "redux-logger";
var mpaInitModel = {
    namespace: "@@mpa",
    state: "@@mpa/running",
    reducer: {
        throwError: function () {
            return "@@mpa/broken";
        }
    }
};
var composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ trace: true, traceLimit: 25 }) || compose;
var mpa = function (options) {
    if (options === void 0) { options = {}; }
    var sagaMiddleware = createSagaMiddleware();
    var _a = options.appReducer, appReducer = _a === void 0 ? {} : _a, _b = options.middlewares, middlewares = _b === void 0 ? [] : _b, _c = options.silence, silence = _c === void 0 ? false : _c;
    var _store = null;
    var _actionsMap = {};
    var _effectsMap = [];
    var core = {
        get store() {
            return _store;
        },
        set store(store) {
            _store = store;
        },
        get dispatch() {
            var store = core.store;
            return store.dispatch;
        },
        _models: [mpaInitModel],
        actions: function (namespace) {
            if (typeof namespace === 'undefined') {
                return _actionsMap;
            }
            return _actionsMap[namespace];
        },
        useModel: function () {
            var _a;
            var models = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                models[_i] = arguments[_i];
            }
            (_a = core._models).push.apply(_a, models);
            return core;
        }, run: run
    };
    return core;
    function createReducers() {
        return core._models.reduce(function (a, b) {
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
            var actionType = namespace + "/" + b;
            a[actionType] = reducer[b];
            if (typeof _actionsMap[namespace] === "undefined") {
                _actionsMap[namespace] = {};
            }
            _actionsMap[namespace] = __assign(__assign({}, _actionsMap[namespace]), (_a = {}, _a[b] = createActionCreater(actionType), _a));
            return a;
        }, {});
        return function (state, action) {
            if (state === void 0) { state = initState; }
            var type = action.type;
            if (reducerFunMap.hasOwnProperty(type)) {
                return reducerFunMap[type](state, action);
            }
            return state;
        };
    }
    function createActionCreater(type) {
        function _actionCreater(payload, meta, error) {
            return {
                type: type, payload: payload, meta: meta, error: error
            };
        }
        _actionCreater._toString = _actionCreater.toString;
        _actionCreater.toString = function () {
            return type;
        };
        return _actionCreater;
    }
    function createEffects() {
        for (var _i = 0, _a = core._models; _i < _a.length; _i++) {
            var model = _a[_i];
            if (model.effect) {
                var _effect = model.effect(core.actions(model.namespace), core.actions());
                _effect.namespace = model.namespace;
                _effectsMap.push(_effect);
            }
        }
        function errorWrapper(saga) {
            return function () {
                var error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 4]);
                            return [4, fork(saga)];
                        case 1:
                            _a.sent();
                            return [3, 4];
                        case 2:
                            error_1 = _a.sent();
                            return [4, put(core.actions('@@mpa').throwError)];
                        case 3:
                            _a.sent();
                            console.log("[model: " + saga.namespace + "]- mpa has caught an error when running effect");
                            console.log(error_1);
                            return [3, 4];
                        case 4: return [2];
                    }
                });
            };
        }
        return function rootSaga() {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, all(_effectsMap.map(errorWrapper).map(fork))];
                    case 1:
                        _a.sent();
                        return [2];
                }
            });
        };
    }
    function run() {
        var _reduxMiddlewares = middlewares;
        if (process.env.NODE_ENV === "development" && !silence) {
            _reduxMiddlewares.push(createLogger({ collapsed: true, diff: true }));
        }
        _reduxMiddlewares.unshift(sagaMiddleware);
        var _reduxReducers = __assign(__assign({}, createReducers()), appReducer);
        var _reduxStore = createStore(combineReducers(_reduxReducers), composeEnhancers(applyMiddleware.apply(void 0, _reduxMiddlewares)));
        sagaMiddleware.run(createEffects());
        core.store = _reduxStore;
        return core;
    }
};
export default mpa;
//# sourceMappingURL=core.js.map