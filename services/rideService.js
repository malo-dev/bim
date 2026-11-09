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
    getTiers: builder.query({
      query: () => ({ url: "/ride-tiers", method: "GET", params: { onlyActive: "true" } }),
      providesTags: ["ride"],
    }),

    estimateRide: builder.mutation({
      query: (data) => ({ url: "/ride/estimate", method: "POST", data }),
    }),

    requestRide: builder.mutation({
      query: (data) => ({ url: "/ride/request", method: "POST", data }),
      invalidatesTags: ["ride"],
    }),

    // Liste des chauffeurs disponibles pour cette course, triés par proximité —
    // c'est le passager qui choisit son chauffeur.
    getAvailableChauffeurs: builder.query({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}/chauffeurs`, method: "GET" }),
      providesTags: ["ride"],
    }),

    offerRideToChauffeur: builder.mutation({
      query: ({ rideNumber, chauffeurId }) => ({ url: `/ride/${rideNumber}/offer/${chauffeurId}`, method: "POST" }),
      invalidatesTags: ["ride"],
    }),

    getRideByNumber: builder.query({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}`, method: "GET" }),
      providesTags: ["ride"],
    }),

    // Course en cours du passager (bandeau de l'accueil, reprise de l'écran taxi).
    getMyActiveRide: builder.query({
      query: () => ({ url: "/ride/active", method: "GET" }),
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

    // ── Côté chauffeur (mode chauffeur, même app) ──
    getChauffeurActiveRide: builder.query({
      query: () => ({ url: "/ride/chauffeur/active", method: "GET" }),
      providesTags: ["ride"],
    }),

    // Offre en attente (si l'événement socket a été manqué, ex. app ouverte depuis le push).
    getChauffeurPendingOffer: builder.query({
      query: () => ({ url: "/ride/chauffeur/offer", method: "GET" }),
    }),

    acceptRide: builder.mutation({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}/accept`, method: "POST" }),
      invalidatesTags: ["ride"],
    }),

    declineRide: builder.mutation({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}/decline`, method: "POST" }),
    }),

    arrivedRide: builder.mutation({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}/arrived`, method: "PUT" }),
      invalidatesTags: ["ride"],
    }),

    // `arg` : numéro de course (passager) ou { rideNumber, pickupCode } (chauffeur :
    // le code donné par le passager est obligatoire pour démarrer).
    startRide: builder.mutation({
      query: (arg) => {
        const rideNumber = typeof arg === "object" ? arg.rideNumber : arg;
        const pickupCode = typeof arg === "object" ? arg.pickupCode : undefined;
        return { url: `/ride/${rideNumber}/start`, method: "PUT", data: pickupCode ? { pickupCode } : undefined };
      },
      invalidatesTags: ["ride"],
    }),

    completeRide: builder.mutation({
      query: (rideNumber) => ({ url: `/ride/${rideNumber}/complete`, method: "PUT" }),
      invalidatesTags: ["ride"],
    }),

    cancelRideByChauffeur: builder.mutation({
      query: ({ rideNumber, reason }) => ({ url: `/ride/${rideNumber}/chauffeur-cancel`, method: "PUT", data: { reason } }),
      invalidatesTags: ["ride"],
    }),
  }),
});

export const {
  useGetTiersQuery,
  useEstimateRideMutation,
  useRequestRideMutation,
  useGetAvailableChauffeursQuery,
  useOfferRideToChauffeurMutation,
  useGetRideByNumberQuery,
  useGetUserRidesQuery,
  useGetMyActiveRideQuery,
  useCancelRideMutation,
  useRateRideMutation,
  useGetChauffeurActiveRideQuery,
  useGetChauffeurPendingOfferQuery,
  useAcceptRideMutation,
  useDeclineRideMutation,
  useArrivedRideMutation,
  useStartRideMutation,
  useCompleteRideMutation,
  useCancelRideByChauffeurMutation,
} = rideApi;
