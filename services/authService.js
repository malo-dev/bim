// services/authService.js
import { createApi } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import axios from 'axios';

// ✅ Support Expo Go + Build
const BASE_URL =
  Constants.expoConfig?.extra?.API_URL ||
  Constants.manifest?.extra?.API_URL ||
  '';

console.log('✅ API_URL =', BASE_URL);

// ✅ Instance axios
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ✅ BaseQuery pour RTK Query
const axiosBaseQuery =
  () =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url, // ⚠️ pas besoin de baseUrl + url
        method,
        data,
        params,
      });

      return { data: result.data };
    } catch (err) {
      console.log('❌ API ERROR:', err?.response || err?.message);

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
} = authApi;