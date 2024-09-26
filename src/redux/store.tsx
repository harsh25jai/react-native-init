import { configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'reduxjs-toolkit-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ExampleSlice from './slices/ExampleSlice';

const persistConfig = {
  key: 'InitApp',
  storage: AsyncStorage,
}

const persistedReducer = persistReducer(persistConfig, ExampleSlice)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: false
  }),
});

export const persistor = persistStore(store);