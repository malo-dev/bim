
import { createApi } from "@reduxjs/toolkit/query/react";
import axiosInstance from "./axiosInstance";


const axiosBaseQuery = () => async ({ url, method, data, params }) => {
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

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["User"],

  endpoints: (builder) => ({
   
    getAllUsers: builder.query({
      query: (params = {}) => ({
        url: "/auth/users",
        method: "GET",
        params: {
          ...params,
          paginate: params.paginate !== undefined ? params.paginate.toString() : "true",
        },
      }),
      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((user) => ({ type: "User", id: user.id })),
              { type: "User", id: "LIST" },
            ]
          : [{ type: "User", id: "LIST" }],
    }),

 
    getUserById: builder.query({
      query: (id) => ({
        url: `/auth/users/${id}`,
        method: "GET",
      }),
      providesTags: (result, error, id) => [{ type: "User", id }],
    }),


    updateUser: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/auth/users/${id}/profile`,
        method: "PUT",
        data: formData,
        headers: { "Content-Type": "multipart/form-data" },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: "User", id }, { type: "User", id: "LIST" }],
    }),

    deleteAccount: builder.mutation({
      query: ({ password }) => ({
        url: "/auth/account",
        method: "DELETE",
        data: { password },
      }),
      invalidatesTags: [{ type: "User", id: "LIST" }],
    }),
  }),
});


export const {
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserMutation,
  useDeleteAccountMutation,
} = userApi;
