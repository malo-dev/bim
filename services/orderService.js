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

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["order"],

  endpoints: (builder) => ({
    getAllOrders: builder.query({
      query: (params) => ({ url: "/order", method: "GET", params }),
      providesTags: ["order"],
    }),

    getorderById: builder.query({
      query: (id) => ({ url: `/order/${id}`, method: "GET" }),
      providesTags: ["order"],
    }),

    /* Mes commandes (client) — groupées par orderNumber */
    getUserOrders: builder.query({
      query: (params) => ({ url: "/order/mine", method: "GET", params }),
      providesTags: ["order"],
    }),

    /* Commandes de l'entreprise (admin entreprise) */
    getCompanyOrders: builder.query({
      query: (params) => ({ url: "/order/my-orders", method: "GET", params }),
      providesTags: ["order"],
    }),

    /* Créer une commande depuis le panier */
    createOrder: builder.mutation({
      query: (data) => ({ url: "/order/create", method: "POST", data }),
      invalidatesTags: ["order"],
    }),

    /* Mettre à jour le statut d'une commande */
    updateOrderStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/order/${id}`,
        method: "PUT",
        data: { status },
      }),
      invalidatesTags: ["order"],
    }),

    /* Payer à la livraison — marque la commande livrée + payée */
    markOrderPaid: builder.mutation({
      query: (orderNumber) => ({
        url: `/order/pay-delivery/${orderNumber}`,
        method: "PUT",
      }),
      invalidatesTags: ["order"],
    }),

    /* Paiement à la livraison avec PIN — split entreprise/livreur */
    payOrderAtDelivery: builder.mutation({
      query: ({ orderNumber, pin }) => ({
        url: `/order/pay/${orderNumber}`,
        method: "POST",
        data: { pin },
      }),
      invalidatesTags: ["order"],
    }),

    deleteorder: builder.mutation({
      query: (id) => ({ url: `/order/${id}`, method: "DELETE" }),
      invalidatesTags: ["order"],
    }),
  }),
});

export const {
  useGetAllOrdersQuery,
  useGetorderByIdQuery,
  useGetUserOrdersQuery,
  useGetCompanyOrdersQuery,
  useCreateOrderMutation,
  useUpdateOrderStatusMutation,
  useMarkOrderPaidMutation,
  usePayOrderAtDeliveryMutation,
  useDeleteorderMutation,
} = orderApi;
