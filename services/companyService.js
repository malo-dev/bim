
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



export const companyApi = createApi({
  reducerPath: "companyApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["company"],

  endpoints: (builder) => ({
    /* GET ALL */
    getAllHistories: builder.query({
      query: (params) => ({
        url: "/company",
        method: "GET",
        params,
      }),
      providesTags: ["company"],
    }),

    /* GET BY ID */
    getcompanyById: builder.query({
      query: (id) => ({
        url: `/company/${id}`,
        method: "GET",
      }),
      providesTags: ["company"],
    }),

    /* CREATE */
    createcompany: builder.mutation({
      query: (data) => ({
        url: "/company/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["company"],
    }),

    /* UPDATE */
    updatecompany: builder.mutation({
      query: ({ id, data }) => ({
        url: `/company/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["company"],
    }),

    /* DELETE */
    deletecompany: builder.mutation({
      query: (id) => ({
        url: `/company/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["company"],
    }),
  }),
});



export const {
  useGetAllHistoriesQuery,
  useGetcompanyByIdQuery,
  useCreatecompanyMutation,
  useUpdatecompanyMutation,
  useDeletecompanyMutation,
} = companyApi;
