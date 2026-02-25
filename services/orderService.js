
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



export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["order"],

  endpoints: (builder) => ({
    getAllHistories: builder.query({
      query: (params) => ({
        url: "/order",
        method: "GET",
        params,
      }),
      providesTags: ["order"],
    }),

    /* GET BY ID */
    getorderById: builder.query({
      query: (id) => ({
        url: `/order/${id}`,
        method: "GET",
      }),
      providesTags: ["order"],
    }),

    /* CREATE */
    createorder: builder.mutation({
      query: (data) => ({
        url: "/order/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["order"],
    }),

    /* UPDATE */
    updateorder: builder.mutation({
      query: ({ id, data }) => ({
        url: `/order/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["order"],
    }),

    /* DELETE */
    deleteorder: builder.mutation({
      query: (id) => ({
        url: `/order/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["order"],
    }),
  }),
});



export const {
  useGetAllHistoriesQuery,
  useGetorderByIdQuery,
  useCreateorderMutation,
  useUpdateorderMutation,
  useDeleteorderMutation,
} = orderApi;
