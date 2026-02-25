// services/sectorService.js
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



export const sectorApi = createApi({
  reducerPath: "sectorApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Sector"],

  endpoints: (builder) => ({
    /* GET ALL */
    getAllSectors: builder.query({
      query: (params) => ({
        url: "/sector",
        method: "GET",
        params,
      }),
      providesTags: ["Sector"],
    }),

    /* GET BY ID */
    getsectorById: builder.query({
      query: (id) => ({
        url: `/sector/${id}`,
        method: "GET",
      }),
      providesTags: ["sector"],
    }),

    /* CREATE */
    createsector: builder.mutation({
      query: (data) => ({
        url: "/sector/create",
        method: "POST",
        data,
      }),
      invalidatesTags: ["sector"],
    }),

    /* UPDATE */
    updatesector: builder.mutation({
      query: ({ id, data }) => ({
        url: `/sector/update/${id}`,
        method: "PUT",
        data,
      }),
      invalidatesTags: ["sector"],
    }),

    /* DELETE */
    deletesector: builder.mutation({
      query: (id) => ({
        url: `/sector/delete/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["sector"],
    }),
  }),
});



export const {
  useGetAllSectorsQuery,
  useGetsectorByIdQuery,
  useCreatesectorMutation,
  useUpdatesectorMutation,
  useDeletesectorMutation,
} = sectorApi;
