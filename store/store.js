import { configureStore, combineReducers } from "@reduxjs/toolkit";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";

import globalReducer from "../services/globalApi";

import { authApi } from "../services/authService";
import { historyApi } from "../services/historyService";
import { notificationApi } from "../services/notificationService";
import { userApi } from "../services/userService";
import { transactionApi } from "../services/tsxService";
import { sectorApi } from "../services/sectorsServices";
import { bonusApi } from "../services/bonusService";
import { productApi } from "../services/productServices";
import { orderApi } from "../services/orderService";
import { companyApi } from "../services/companyService";
import { notesApi } from "../services/notesService";
import { livreurApi } from "../services/livreurService";

const persistConfig = {
  key: "global",
  storage: AsyncStorage,
  whitelist: ["sectors", "selectedBusinessId"],
};

const rootReducer = combineReducers({
  [authApi.reducerPath]: authApi.reducer,
  [historyApi.reducerPath]: historyApi.reducer,
  [notificationApi.reducerPath]: notificationApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [transactionApi.reducerPath]: transactionApi.reducer,
  [sectorApi.reducerPath]: sectorApi.reducer,
  [bonusApi.reducerPath]: bonusApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [companyApi.reducerPath]: companyApi.reducer,
  [notesApi.reducerPath]: notesApi.reducer,
  [livreurApi.reducerPath]: livreurApi.reducer,

  global: persistReducer(persistConfig, globalReducer),
});

export const store = configureStore({
  reducer: rootReducer,

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      authApi.middleware,
      historyApi.middleware,
      notificationApi.middleware,
      userApi.middleware,
      transactionApi.middleware,
      sectorApi.middleware,
      bonusApi.middleware,
      productApi.middleware,
      orderApi.middleware,
      companyApi.middleware,
      notesApi.middleware,
      livreurApi.middleware
    ),
});

export const persistor = persistStore(store);
