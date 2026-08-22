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

export const tutorialApi = createApi({
  reducerPath: 'tutorialApi',
  baseQuery:   axiosBaseQuery({ baseUrl: BASE_URL }),
  tagTypes:    ['Tutorials'],
  endpoints:   (builder) => ({

    // Liste publique des tutoriels actifs
    getTutorials: builder.query({
      query: () => ({ url: '/tutorial/list', method: 'GET' }),
      providesTags: ['Tutorials'],
    }),
  }),
});

export const { useGetTutorialsQuery } = tutorialApi;
