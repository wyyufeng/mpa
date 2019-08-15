map 是基于`redux`、`redux-saga` 做的非常浅的包装(浅的不能再浅)，将原来需要单独定义的 action、actionCreator、reducer、saga 定义到一个 model 对象上，然后 mpa 负责将定义的 reducer 和 saga 注册到 redux 中,并创建 action 函数仅此而已

## 安装

```
npm install @mpfe/mpa
//or
yarn add @mpfe/mpa
```

## API

#### mpa({appReducers?,middlewares?})

构造函数，生成 mpa 实例,可以传入 redux reducer 和和 redux middleware,注意这个传入的 reducer 需要是合法的 `combineReducer` 参数

#### run

mpa 实例启动函数，必须在启动之前注册 model， 启动之后注入 store

#### useModel

注册 model，一个 model 是对一个状态的变化的封装
其接口描述如下

```typescript
interface Model {
  namespace: string;
  state: any;
  reducer: ReducerMap;
  effect?: Function;
}
```

注意：基于约定大于配置原则，这里使用社区规范生成 action
一个 action 应该具有如下形状

```typescript
interface Action {
  type: string;
  payload?: any;
  meta?: any;
  error?: any;
}
```

---

`namespace`:作为 store 的 key 以及 action type 的前缀限定

`state`: 初始状态

`reducer`: 一个描述状态变化的对象
其接口描述为

```typescript
interface ReducerMap {
  [actionType: string]: Reducer;
}
```

如下 reducer 将生成形如 `{type:"todo/start"}`的`action`

```javascript
{ name:"todo",
  reducer: {
    start: state => state;
  }
}
```

`effect($action,actions)`:redux-saga 生成函数，接受该 namespace 下的 action 和全部的 action 作为参数，并返回一个 saga，这个 saga 将直接作为 sagaMiddleware.run 的参数

```javascript
{
  effect: ($action, actions) => {
    return saga;
  };
}
```

一个完整的 model 示例

```javascript
{
    namespace: "list",
    state: {
      isLoading: false,
      records: [],
      error:null
    },
    reducer: {
      start: state=> ({ ...state, isLoading: true }),
      success: (_, action) => {
        return {
          isLoading: false,
          ...action.payload
        };
      },
      failure: (state, action) => ({
        ...state,
        isLoading: false,
        error: action.error
      })
    },
    effect: ($action) => {
      function* worker(action) {
        try {
          const data = yield call(dataProvider, { ...action.payload });
          yield put(
            $action.success({
              records: data.records,
            })
          );
        } catch (error) {
          //这里基于规范，第一个参数为payload，第二个参数为meta，第三个参数为error
          yield put($action.failure(null, null, error));
        }
      }
      return function*() {
        yield takeLatest($action.start().type, worker);
      };
    }
  };
```

`actions(namespace?)`:如果传入 namespace 则返回该命名空间下的 actions。否则返回全部的 actions
