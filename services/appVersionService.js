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

// Config version PlayStore/App Store renseignée par l'admin, pour proposer
// une mise à jour à l'utilisateur quand une nouvelle version est publiée.
export const appVersionApi = createApi({
  reducerPath: "appVersionApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["appVersion"],

  endpoints: (builder) => ({
    getAppVersion: builder.query({
      query: (platform) => ({
        url: "/app_version/check",
        method: "GET",
        params: { platform },
      }),
      providesTags: ["appVersion"],
    }),
  }),
});

export const { useGetAppVersionQuery } = appVersionApi;
