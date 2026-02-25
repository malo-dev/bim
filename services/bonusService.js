
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



export const bonusApi = createApi({
  reducerPath: "bonusApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["bonus"],

  endpoints: (builder) => ({
    getAllHistories: builder.query({
      query: (params) => ({
        url: "/bonus",
        method: "GET",
        params,
      }),
      providesTags: ["bonus"],
    }),

    /* GET BY ID */
    getbonusById: builder.query({
      query: (id) => ({
        url: `/bonus/${id}`,
        method: "GET",
      }),
      providesTags: ["bonus"],
    }),

    /* CREATE */
    createbonus: builder.mutation({
      query: (data) => ({
        url: "/bonus/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["bonus"],
    }),

    /* UPDATE */
    updatebonus: builder.mutation({
      query: ({ id, data }) => ({
        url: `/bonus/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["bonus"],
    }),

    /* DELETE */
    deletebonus: builder.mutation({
      query: (id) => ({
        url: `/bonus/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["bonus"],
    }),
  }),
});



export const {
  useGetAllHistoriesQuery,
  useGetbonusByIdQuery,
  useCreatebonusMutation,
  useUpdatebonusMutation,
  useDeletebonusMutation,
} = bonusApi;
