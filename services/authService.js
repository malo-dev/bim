// services/authService.js
import { createApi } from '@reduxjs/toolkit/query/react';
import axiosInstance from './axiosInstance';

// ✅ BaseQuery utilisant l'instance partagée (avec intercepteur token)
const axiosBaseQuery =
  () =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({ url, method, data, params, headers });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status || 500,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// ✅ API RTK Query
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        data: userData,
      }),
    }),

    login: builder.mutation({
      query: (userData) => ({
        url: '/auth/login',
        method: 'POST',
        data: userData,
      }),
    }),

    logOut: builder.mutation({
      query: (userData) => ({
        url: '/auth/logOut',
        method: 'POST',
        data: userData,
      }),
    }),

    askPasswordReset: builder.mutation({
      query: (userData) => ({
        url: '/auth/ask-password-reset',
        method: 'POST',
        data: userData,
      }),
    }),

    resetPassword: builder.mutation({
      query: (userData) => ({
        url: '/auth/reset-password',
        method: 'POST',
        data: userData,
      }),
    }),

    verifyOtp: builder.mutation({
      query: (userData) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        data: userData,
      }),
    }),

    verifyPass: builder.mutation({
      query: (userData) => ({
        url: '/auth/verifyPwd',
        method: 'POST',
        data: userData,
      }),
    }),

    refresh: builder.mutation({
      query: (userData) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        data: userData,
      }),
    }),

    storeExpoPushToken: builder.mutation({
      query: ({ userId, expoPushToken }) => ({
        url: `/auth/users/${userId}/expoPushToken`,
        method: 'POST',
        data: { expoPushToken },
      }),
    }),

    sendUserSOS: builder.mutation({
      query: ({ category, type, subType, caseLocation, contactPhone, latitude, longitude }) => ({
        url: '/auth/sos',
        method: 'POST',
        data: { category, type, subType, caseLocation, contactPhone, latitude, longitude },
      }),
    }),
  }),
});

// ✅ Hooks export
export const {
  useRegisterMutation,
  useLoginMutation,
  useLogOutMutation,
  useAskPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useVerifyPassMutation,
  useRefreshMutation,
  useStoreExpoPushTokenMutation,
  useSendUserSOSMutation,
} = authApi;