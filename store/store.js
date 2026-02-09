import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../services/authService";
import { historyApi } from "../services/historyService";
import {notificationApi} from '../services/notificationService'
import {userApi} from '../services/userService'
import {transactionApi} from '../services/tsxService'
export const store = configureStore({
  reducer: {
    [authApi.reducerPath]: authApi.reducer,
    [historyApi.reducerPath]: historyApi.reducer,
    [notificationApi.reducerPath]: notificationApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [transactionApi.reducerPath]: transactionApi.reducer,
  },

  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      historyApi.middleware,
      notificationApi.middleware,
      userApi.middleware,
      transactionApi.middleware
    ),
});
