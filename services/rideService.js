import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "./axiosInstance";

const axiosBaseQuery =
  () =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({ url, method, data, params });
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

// BIM Transport — courses type VTC (Bim Ride).
export const rideApi = createApi({
  reducerPath: "rideApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["ride"],

  endpoints: (builder) => ({
    estimateRide: builder.mutation({
      query: (data) => ({ url: "/ride/estimate", method: "POST", data }),
    }),

    requestRide: builder.mutation({
      query: (data) => ({ url: "/ride/request", method: "POST", data }),
      invalidatesTags: ["ride"],
    }),

    getRideByNumber: builder.query({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}`, method: "GET" }),
      providesTags: ["ride"],
    }),

    getUserRides: builder.query({
      query: (params) => ({ url: "/ride/history", method: "GET", params }),
      providesTags: ["ride"],
    }),

    cancelRide: builder.mutation({
      query: ({ rideNumber, reason }) => ({ url: `/ride/${rideNumber}/cancel`, method: "PUT", data: { reason } }),
      invalidatesTags: ["ride"],
    }),

    rateRide: builder.mutation({
      query: ({ rideNumber, ...data }) => ({ url: `/ride/${rideNumber}/rate`, method: "POST", data }),
      invalidatesTags: ["ride"],
    }),
  }),
});

export const {
  useEstimateRideMutation,
  useRequestRideMutation,
  useGetRideByNumberQuery,
  useGetUserRidesQuery,
  useCancelRideMutation,
  useRateRideMutation,
} = rideApi;
