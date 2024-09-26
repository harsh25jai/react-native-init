import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  data: {},
  dataAdded: false,
};

export const ExampleSlice = createSlice({
  name: 'ExampleSlice',
  initialState,
  reducers: {
    setData: (state, action) => {
      state.data = action.payload;
    },
    setDataAdded: (state, action) => {
      state.dataAdded = action.payload;
    },
    deleteData: (state, action) => {
      state.data = {};
      state.dataAdded = false;
    },
  },
});

export const {setData, setDataAdded, deleteData} = ExampleSlice.actions;

export default ExampleSlice.reducer;
