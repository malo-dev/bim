// services/authService.js
import { createApi } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import axios from 'axios';

const BASE_URL = Constants.expoConfig.extra.API_URL;

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
        method,
        data,
        params,
      });

      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL }),
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

    refresh: builder.mutation({
      query: (userData) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        data: userData,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogOutMutation,
  useAskPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useRefreshMutation
} = authApi;

