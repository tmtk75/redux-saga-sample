"use strict"
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux'
import { Provider, connect } from 'react-redux'
import { createAction, handleActions } from 'redux-actions'
import createSagaMiddleware, { takeEvery, delay } from 'redux-saga'
import { call, put, fork, select } from 'redux-saga/effects'

const initialState = {
  user: {
    login: "annonymous",
    id: -1,
  },
  users: [],
}

const reducer = handleActions({
  USER_FETCH_REQUESTED: (state, action) => Object.assign({}, state, {fetching: true}),

  USER_FETCH_SUCCEEDED: (state, action) => Object.assign({}, state, {user: action.payload}, {fetching: false}),

  USER_FETCH_FAILED: (state, action) => Object.assign({}, state, {
    error: action.payload.error, fetching: false, login: "", id: -1,
  }),

  USERS_FETCH_REQUESTED: (state, action) => Object.assign({}, state, {fetching: true}),

  USERS_FETCH_SUCCEEDED: (state, action) => Object.assign({}, state, {users: action.payload}, {fetching: false}),
}, initialState);

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {text: "github"}
  }
  render() {
    const { user, fetching, error } = this.props;
    const { users } = this.props;
    return (
      <div>
        <div>
          <input value={this.state.text} onChange={this.onChange.bind(this)} />
          <button onClick={this.onFetchClicked.bind(this)}>Fetch</button>
          login: { user.login }, id: { user.id }
          { fetching ? "fetching" : null }
          { error ? error.message : null }
        </div>
        <ul>
          {users.map((u, idx) => <li key={idx} onClick={this.onUserClicked.bind(this, idx)}>{u.login}</li>)}
        </ul>
      </div>
    )
  }
  componentDidMount() {
    this.props.dispatch({type: 'USERS_FETCH_REQUESTED'});
  }
  onChange(e) {
    this.setState({text: e.target.value});
  }
  onFetchClicked() {
    this.props.dispatch({type: 'USER_FETCH_REQUESTED', payload: {login: this.state.text}})
  }
  onUserClicked(idx, e) {
    this.setState({text: this.props.users[idx].login});
  }
}

const API = {
  fetchUser: (login) => {
    if (login === "fail") {
      throw new Error("somehow failed");
    }
    return fetch(`https://api.github.com/users/${login}`).then(res => res.json())
  },
  fetchUsers: (login) => fetch(`https://api.github.com/users`).then(res => res.json()),
}

function* fetchUser(action) {
  try {
     const user = yield call(API.fetchUser, action.payload.login);
     const success = createAction("USER_FETCH_SUCCEEDED");
     yield put(success(user));
  } catch (e) {
     yield put({type: "USER_FETCH_FAILED", payload: {error: new Error(e.message)}});
  }
}

function* fetchUsers(action) {
     yield put(createAction("USERS_FETCH_SUCCEEDED")(yield call(API.fetchUsers)));
}

function* userFetchSaga() {
  yield* takeEvery("USER_FETCH_REQUESTED", fetchUser);
}

function* usersFetchSaga() {
  yield* takeEvery("USERS_FETCH_REQUESTED", fetchUsers);
}

function* logger(e) {
  console.log("saga:", {action: e.type, state: yield select()});
}

function* loggerSaga() {
  yield* takeEvery("*", logger);
}

function* rootSaga() {
  yield fork(userFetchSaga);
  yield fork(usersFetchSaga);
  yield fork(loggerSaga);
}

const sagaMiddleware = createSagaMiddleware()
const middlewares = applyMiddleware(sagaMiddleware);
const devtools = window.devToolsExtension && window.devToolsExtension()
const store = createStore(reducer, devtools, middlewares);
sagaMiddleware.run(rootSaga);

const MyApp = connect(s => s)(App);
ReactDOM.render(
  <Provider store={store}>
    <MyApp />
  </Provider>
  , document.getElementById('main')
)
