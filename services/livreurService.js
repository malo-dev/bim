import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "./axiosInstance";

const axiosBaseQuery =
  () =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({ url, method, data, params, headers });
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

export const livreurApi = createApi({
  reducerPath: "livreurApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["livreur"],

  endpoints: (builder) => ({
    // Connexion espace livreur
    loginLivreur: builder.mutation({
      query: (data) => ({ url: "/livreur/login", method: "POST", data }),
    }),

    // Postuler comme livreur (FormData avec images)
    applyAsLivreur: builder.mutation({
      query: (formData) => ({
        url: "/livreur/apply",
        method: "POST",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      }),
      invalidatesTags: ["livreur"],
    }),

    // Mon profil livreur
    getMyLivreurProfile: builder.query({
      query: () => ({ url: "/livreur/me", method: "GET" }),
      providesTags: ["livreur"],
    }),

    // Activer/désactiver mode livreur
    toggleLivreurOnline: builder.mutation({
      query: () => ({ url: "/livreur/toggle-online", method: "PUT" }),
      invalidatesTags: ["livreur"],
    }),

    // Mettre à jour position GPS
    updateLivreurLocation: builder.mutation({
      query: (data) => ({ url: "/livreur/location", method: "PUT", data }),
    }),

    // Profil public d'un livreur
    getLivreurPublicProfile: builder.query({
      query: (userId) => ({ url: `/livreur/public/${userId}`, method: "GET" }),
      providesTags: ["livreur"],
    }),

    // Candidatures entreprise (admin)
    getCompanyLivreurs: builder.query({
      query: (params) => ({ url: "/livreur/company/candidates", method: "GET", params }),
      providesTags: ["livreur"],
    }),

    // Changer statut livreur (admin)
    updateLivreurStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/livreur/${id}/status`, method: "PUT", data: { status } }),
      invalidatesTags: ["livreur"],
    }),

    // Noter un livreur
    rateLivreur: builder.mutation({
      query: ({ id, score, comment }) => ({
        url: `/livreur/${id}/rate`,
        method: "POST",
        data: { score, comment },
      }),
      invalidatesTags: ["livreur"],
    }),

    // Commandes disponibles pour le livreur
    getAvailableOrders: builder.query({
      query: () => ({ url: "/livreur/orders/available", method: "GET" }),
      providesTags: ["livreur"],
    }),

    // Mes livraisons en cours
    getMyDeliveries: builder.query({
      query: () => ({ url: "/livreur/orders/mine", method: "GET" }),
      providesTags: ["livreur"],
    }),

    // Accepter une commande
    acceptOrder: builder.mutation({
      query: (orderNumber) => ({ url: `/livreur/orders/accept/${orderNumber}`, method: "PUT" }),
      invalidatesTags: ["livreur"],
    }),

    // Annuler une livraison
    cancelDelivery: builder.mutation({
      query: (orderNumber) => ({ url: `/livreur/orders/cancel/${orderNumber}`, method: "PUT" }),
      invalidatesTags: ["livreur"],
    }),

    // Revenus et commissions par période
    getMyEarnings: builder.query({
      query: () => ({ url: "/livreur/earnings", method: "GET" }),
      providesTags: ["livreur"],
    }),

    // Alerte SOS
    sendSOS: builder.mutation({
      query: (data) => ({ url: "/livreur/sos", method: "POST", data }),
    }),

    // Mes évaluations (filtrables par période)
    getMyRatings: builder.query({
      query: (period) => ({
        url: "/livreur/my-ratings",
        method: "GET",
        params: period ? { period } : {},
      }),
      providesTags: ["livreur"],
    }),
  }),
});

export const {
  useLoginLivreurMutation,
  useApplyAsLivreurMutation,
  useGetMyLivreurProfileQuery,
  useToggleLivreurOnlineMutation,
  useUpdateLivreurLocationMutation,
  useGetLivreurPublicProfileQuery,
  useGetCompanyLivreursQuery,
  useUpdateLivreurStatusMutation,
  useRateLivreurMutation,
  useGetAvailableOrdersQuery,
  useGetMyDeliveriesQuery,
  useAcceptOrderMutation,
  useCancelDeliveryMutation,
  useGetMyEarningsQuery,
  useSendSOSMutation,
  useGetMyRatingsQuery,
} = livreurApi;
