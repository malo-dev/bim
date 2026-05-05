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

export const notesApi = createApi({
  reducerPath: "notesApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Notes"],

  endpoints: (builder) => ({
    /* GET notes d'une company — retourne averageStars + liste */
    getNotesByCompany: builder.query({
      query: (companyId) => ({
        url: `/notes/company/${companyId}`,
        method: "GET",
      }),
      providesTags: (result, error, companyId) => [{ type: "Notes", id: companyId }],
    }),

    /* POST créer / mettre à jour une note (upsert côté backend) */
    createNote: builder.mutation({
      query: (data) => ({
        url: "/notes/create",
        method: "POST",
        data,
      }),
      invalidatesTags: (result, error, arg) => [{ type: "Notes", id: String(arg.companyId) }],
    }),
  }),
});

export const {
  useGetNotesByCompanyQuery,
  useCreateNoteMutation,
} = notesApi;
