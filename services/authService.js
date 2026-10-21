// services/authService.js
import { createApi } from '@reduxjs/toolkit/query/react';
import * as Device from 'expo-device';
import axiosInstance from './axiosInstance';

// ✅ BaseQuery utilisant l'instance partagée (avec intercepteur token)
const axiosBaseQuery =
  () =>
  async ({ url, method, data, params, headers }) => {
    try {
      const result = await axiosInstance({ url, method, data, params, headers });
      return { data: result.data };
    } catch (err) {
      return {
        error: {
          status: err.response?.status || 500,
          data: err.response?.data || err.message,
        },
      };
    }
  };

// ✅ API RTK Query
export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        data: userData,
      }),
    }),

    // Compte créé silencieusement à la fin de l'onboarding, sans email ni
    // mot de passe. Si `telephone` correspond à un compte existant, on le
    // retrouve au lieu d'en créer un nouveau. On remonte aussi le modèle et
    // la marque de l'appareil : le téléphone seul n'étant pas vérifié par
    // SMS, c'est un deuxième signal pour repérer les comptes "rapides"
    // multiples créés depuis le même appareil.
    quickAccess: builder.mutation({
      // `arg` est soit un numéro de téléphone (compatibilité avec les appels
      // existants), soit { telephone, password, mustExist }. `mustExist`
      // sert à l'écran "Déjà client" : si vrai, le serveur renvoie une
      // erreur 404 au lieu de créer un nouveau compte quand le numéro est
      // introuvable (évite de créer un compte fantôme sur une faute de frappe).
      query: (arg) => {
        const telephone = arg && typeof arg === 'object' ? arg.telephone : arg;
        const password = arg && typeof arg === 'object' ? arg.password : undefined;
        const mustExist = arg && typeof arg === 'object' ? arg.mustExist : undefined;
        return {
          url: '/auth/quick-access',
          method: 'POST',
          data: {
            telephone: telephone || undefined,
            password: password || undefined,
            mustExist: mustExist || undefined,
            deviceModel: Device.modelName || undefined,
            deviceBrand: Device.brand || undefined,
          },
        };
      },
    }),

    login: builder.mutation({
      query: (userData) => ({
        url: '/auth/login',
        method: 'POST',
        data: userData,
      }),
    }),

    logOut: builder.mutation({
      query: (userData) => ({
        url: '/auth/logOut',
        method: 'POST',
        data: userData,
      }),
    }),

    // Réaction à l'alerte "nouvelle connexion détectée" — pas d'ancien mot
    // de passe requis, l'appareil appelant est déjà authentifié.
    secureMyAccount: builder.mutation({
      query: (newPassword) => ({
        url: '/auth/secure-my-account',
        method: 'POST',
        data: { newPassword },
      }),
    }),

    // Code partagé qui révèle les entrées "staff" (Espace Livreur, Espace
    // Chauffeur, Espace Gestion) dans Réglages — géré depuis admin-bim,
    // plus codé en dur côté app.
    verifyAccessCode: builder.mutation({
      query: (code) => ({
        url: '/access-code/verify',
        method: 'POST',
        data: { code },
      }),
    }),

    askPasswordReset: builder.mutation({
      query: (userData) => ({
        url: '/auth/ask-password-reset',
        method: 'POST',
        data: userData,
      }),
    }),

    resetPassword: builder.mutation({
      query: (userData) => ({
        url: '/auth/reset-password',
        method: 'POST',
        data: userData,
      }),
    }),

    verifyOtp: builder.mutation({
      query: (userData) => ({
        url: '/auth/verify-otp',
        method: 'POST',
        data: userData,
      }),
    }),

    verifyPass: builder.mutation({
      query: (userData) => ({
        url: '/auth/verifyPwd',
        method: 'POST',
        data: userData,
      }),
    }),

    refresh: builder.mutation({
      query: (userData) => ({
        url: '/auth/refresh-token',
        method: 'POST',
        data: userData,
      }),
    }),

    storeExpoPushToken: builder.mutation({
      query: ({ userId, expoPushToken }) => ({
        url: `/auth/users/${userId}/expoPushToken`,
        method: 'POST',
        data: { tokenPush: expoPushToken },
      }),
    }),

    sendUserSOS: builder.mutation({
      query: ({ category, type, subType, caseLocation, contactPhone, latitude, longitude }) => ({
        url: '/auth/sos',
        method: 'POST',
        data: { category, type, subType, caseLocation, contactPhone, latitude, longitude },
      }),
    }),

    // Mot de passe de transaction (code à 6 chiffres envoyé par email à
    // l'activation du compte, distinct du mot de passe de connexion) —
    // permet à l'utilisateur de le retrouver s'il l'a oublié.
    getMyTransactionPassword: builder.mutation({
      query: (userId) => ({
        url: `/auth/users/${userId}/transaction-password`,
        method: 'GET',
      }),
    }),
  }),
});

// ✅ Hooks export
export const {
  useRegisterMutation,
  useLoginMutation,
  useLogOutMutation,
  useSecureMyAccountMutation,
  useAskPasswordResetMutation,
  useResetPasswordMutation,
  useVerifyOtpMutation,
  useVerifyPassMutation,
  useRefreshMutation,
  useStoreExpoPushTokenMutation,
  useSendUserSOSMutation,
  useGetMyTransactionPasswordMutation,
  useQuickAccessMutation,
  useVerifyAccessCodeMutation,
} = authApi;