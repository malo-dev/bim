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

// Bannières "Nos offres spéciales" affichées sur l'accueil de l'app.
export const bannerApi = createApi({
  reducerPath: "bannerApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["banner"],

  endpoints: (builder) => ({
    getAllBanners: builder.query({
      query: (params) => ({
        url: "/banner",
        method: "GET",
        params: { onlyActive: "true", ...params },
      }),
      providesTags: ["banner"],
    }),
  }),
});

export const { useGetAllBannersQuery } = bannerApi;
