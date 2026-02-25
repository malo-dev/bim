// services/transactionService.js
import { createApi } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import axiosInstance from "./axiosInstance"; 
const BASE_URL = Constants.expoConfig.extra.API_URL;



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

export const transactionApi = createApi({
  reducerPath: 'transactionApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Recharge', 'Transaction', 'Transfert', 'Paiement'],
  endpoints: (builder) => ({
 
    createRecharge: builder.mutation({
      query: (rechargeData) => ({
        url: '/tsx/createrecharge',
        method: 'POST',
        data: rechargeData,
      }),
      invalidatesTags: ['Recharge'],
    }),
    checkRechargeStatus: builder.mutation({
      query: (payload) => ({
        url: '/tsx/recharge/status',
        method: 'POST',
        data: payload,
      }),
    }),
    recharge: builder.mutation({
      query: (payload) => ({
        url: '/tsx/recharge',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Recharge'],
    }),

    // ==== PAIEMENT ====
    createPaiement: builder.mutation({
      query: (payload) => ({
        url: '/tsx/paiement',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Paiement'],
    }),

    // ==== TRANSFERT ====
    createTransfert: builder.mutation({
      query: (payload) => ({
        url: '/tsx/transfert',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Transfert'],
    }),

    // ==== TRANSACTIONS CRUD ====
    getAllTransactions: builder.query({
      query: (params) => ({
        url: '/tsx',
        method: 'GET',
        params,
      }),
      providesTags: ['Transaction'],
    }),
    getTransactionById: builder.query({
      query: (id) => ({
        url: `/tsx/transactions/${id}`,
        method: 'GET',
      }),
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation({
      query: (payload) => ({
        url: '/tsx/transactions',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Transaction'],
    }),
    updateTransaction: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `/tsx/transactions/${id}`,
        method: 'PUT',
        data: payload,
      }),
      invalidatesTags: ['Transaction'],
    }),
    deleteTransaction: builder.mutation({
      query: (id) => ({
        url: `/tsx/transactions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Transaction'],
    }),

    createRetrait: builder.mutation({
      query: (payload) => ({
        url: '/tsx/retrait',
        method: 'POST',
        data: payload,
      }),
      invalidatesTags: ['Paiement'],
    }),
  }),
});

export const {
  useCreateRechargeMutation,
  useCheckRechargeStatusMutation,
  useRechargeMutation,
  useCreatePaiementMutation,
  useCreateTransfertMutation,
  useGetAllTransactionsQuery,
  useGetTransactionByIdQuery,
  useCreateTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
   useCreateRetraitMutation,
} = transactionApi;
