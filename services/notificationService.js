import { createApi } from '@reduxjs/toolkit/query/react';
import Constants from 'expo-constants';

import axiosInstance from "./axiosInstance"; 

const BASE_URL = Constants.expoConfig.extra.API_URL;



const axiosBaseQuery =
  ({ baseUrl } = { baseUrl: '' }) =>
  async ({ url, method, data, params }) => {
    try {
      const result = await axiosInstance({
        url: baseUrl + url,
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


export const notificationApi = createApi({
  reducerPath: 'notificationApi',
  baseQuery: axiosBaseQuery({ baseUrl: BASE_URL }),
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    
    getAllNotifications: builder.query({
      query: ({ userId, search = "", page = 1, pageSize = 20, filters ,paginate='true'}) => ({
        url: "/notification_track",
        method: "GET",
        params: { userId, search, page, pageSize, filters,paginate },
      }),
    providesTags: ["Notifications"],
    }),
  

  
    getNotificationById: builder.query({
      query: (id) => ({
        url: `/notification_track/${id}`,
        method: 'GET',
      }),
    }),
    createNotification: builder.mutation({
      query: (data) => ({
        url: '/notification_track/create',
        method: 'POST',
        data,
      }),
      invalidatesTags: ['Notifications'],
    }),

    updateNotification: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/notification_track/update/${id}`,
        method: 'PUT',
        data,
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/notification_track/delete/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),

    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/notification_track/mark_read/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
  }),
});

export const {
  useGetAllNotificationsQuery,
  useGetNotificationByIdQuery,
  useCreateNotificationMutation,
  useUpdateNotificationMutation,
  useDeleteNotificationMutation,
  useMarkAsReadMutation,
} = notificationApi;
