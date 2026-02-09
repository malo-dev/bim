// services/historyService.js
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "./axiosInstance"; 



const axiosBaseQuery =
  () =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url,
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



export const historyApi = createApi({
  reducerPath: "historyApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["History"],

  endpoints: (builder) => ({
    /* GET ALL */
    getAllHistories: builder.query({
      query: (params) => ({
        url: "/history",
        method: "GET",
        params,
      }),
      providesTags: ["History"],
    }),

    /* GET BY ID */
    getHistoryById: builder.query({
      query: (id) => ({
        url: `/history/${id}`,
        method: "GET",
      }),
      providesTags: ["History"],
    }),

    /* CREATE */
    createHistory: builder.mutation({
      query: (data) => ({
        url: "/history/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["History"],
    }),

    /* UPDATE */
    updateHistory: builder.mutation({
      query: ({ id, data }) => ({
        url: `/history/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["History"],
    }),

    /* DELETE */
    deleteHistory: builder.mutation({
      query: (id) => ({
        url: `/history/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["History"],
    }),
  }),
});



export const {
  useGetAllHistoriesQuery,
  useGetHistoryByIdQuery,
  useCreateHistoryMutation,
  useUpdateHistoryMutation,
  useDeleteHistoryMutation,
} = historyApi;
