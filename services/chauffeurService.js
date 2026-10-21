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

// BIM Transport — profil chauffeur (mode chauffeur, dans la même app BIM).
export const chauffeurApi = createApi({
  reducerPath: "chauffeurApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["chauffeurMe"],

  endpoints: (builder) => ({
    getMyChauffeur: builder.query({
      query: () => ({ url: "/chauffeur/me", method: "GET" }),
      providesTags: ["chauffeurMe"],
    }),

    registerChauffeur: builder.mutation({
      query: (data) => ({ url: "/chauffeur/register", method: "POST", data }),
      invalidatesTags: ["chauffeurMe"],
    }),

    toggleOnline: builder.mutation({
      query: () => ({ url: "/chauffeur/toggle-online", method: "PUT" }),
      invalidatesTags: ["chauffeurMe"],
    }),

    updateChauffeurLocation: builder.mutation({
      query: (data) => ({ url: "/chauffeur/location", method: "PUT", data }),
    }),

    // Connexion par code d'accès personnel donné par l'admin — pas besoin
    // d'avoir déjà un compte BIM, le compte est créé à la volée si besoin.
    chauffeurAccess: builder.mutation({
      query: (accessCode) => ({ url: "/chauffeur/access", method: "POST", data: { accessCode } }),
    }),
  }),
});

export const {
  useGetMyChauffeurQuery,
  useRegisterChauffeurMutation,
  useToggleOnlineMutation,
  useUpdateChauffeurLocationMutation,
  useChauffeurAccessMutation,
} = chauffeurApi;
