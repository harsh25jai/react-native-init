import React from 'react';
import {makeObservable, action, observable} from 'mobx';

class ExampleStore {
  data = {};

  constructor() {
    makeObservable(this, {
      data: observable,
      add: action.bound,
      remove: action.bound,
    });
  }

  add(payload) {
    this.data = payload;
  }

  remove() {
    this.data = {};
  }
}

// Instantiate the example store.
const exampleStore = new ExampleStore();
// Create a React Context with the example store instance.
export const ExampleStoreContext = React.createContext(exampleStore);
export const useExampleStore = () => React.useContext(ExampleStoreContext);
