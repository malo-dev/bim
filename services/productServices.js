
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



export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["product"],

  endpoints: (builder) => ({
    getAllProducts: builder.query({
      query: (params) => ({
        url: "/product",
        method: "GET",
        params,
      }),
      providesTags: ["product"],
    }),

    /* GET BY ID */
    getproductById: builder.query({
      query: (id) => ({
        url: `/product/${id}`,
        method: "GET",
      }),
      providesTags: ["product"],
    }),

    /* CREATE */
    createproduct: builder.mutation({
      query: (data) => ({
        url: "/product/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["product"],
    }),

    /* UPDATE */
    updateproduct: builder.mutation({
      query: ({ id, data }) => ({
        url: `/product/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["product"],
    }),

    /* DELETE */
    deleteproduct: builder.mutation({
      query: (id) => ({
        url: `/product/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["product"],
    }),
  }),
});



export const {
  useGetAllProductsQuery,
  useGetproductByIdQuery,
  useCreateproductMutation,
  useUpdateproductMutation,
  useDeleteproductMutation,
} = productApi;
