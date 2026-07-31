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

export const favoriteApi = createApi({
  reducerPath: "favoriteApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["favorites"],

  endpoints: (builder) => ({
    getFavoriteIds: builder.query({
      query: () => ({ url: "/favorite/ids", method: "GET" }),
      providesTags: ["favorites"],
    }),

    getUserFavorites: builder.query({
      query: () => ({ url: "/favorite", method: "GET" }),
      providesTags: ["favorites"],
    }),

    toggleFavorite: builder.mutation({
      query: (productId) => ({
        url: "/favorite/toggle",
        method: "POST",
        data: { productId },
      }),
      invalidatesTags: ["favorites"],
    }),
  }),
});

export const {
  useGetFavoriteIdsQuery,
  useGetUserFavoritesQuery,
  useToggleFavoriteMutation,
} = favoriteApi;
