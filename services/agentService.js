import { createApi } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';
import axiosInstance from './axiosInstance';

const BASE_URL = Constants.expoConfig.extra.API_URL;

const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({ url: baseUrl + url, method, data, params });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status,
          data:   err.response?.data || err.message,
        },
      };
    }
  };

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery:   axiosBaseQuery({ baseUrl: BASE_URL }),
  tagTypes:    ['AgentStats', 'AgentRetraits'],
  endpoints:   (builder) => ({

    // Stats du dashboard agent (solde, totaux)
    getAgentStats: builder.query({
      query: () => ({ url: '/agent/stats', method: 'GET' }),
      providesTags: ['AgentStats'],
    }),

    // Retraits reçus par l'agent, filtrables par période
    getAgentRetraits: builder.query({
      query: (params) => ({ url: '/agent/my-retraits', method: 'GET', params }),
      providesTags: ['AgentRetraits'],
    }),
  }),
});

export const {
  useGetAgentStatsQuery,
  useGetAgentRetraitsQuery,
} = agentApi;
