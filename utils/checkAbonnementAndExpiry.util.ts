import {jwtDecode } from "jwt-decode";

/**
 * Vérifie le token abonnement et retourne soit :
 * - "recharge" si inexistant ou expiré
 * - la date d'expiration formatée "MM/YY" si valide
 * @param {string|null} tokenAbonnement - JWT du backend
 * @returns {string} - "recharge" ou "MM/YY"
 */
export function checkAbonnementAndExpiry(tokenAbonnement:string) {
  if (!tokenAbonnement) return "recharge";

  try {
    const decoded = jwtDecode(tokenAbonnement);
    const now = Date.now() / 1000; // timestamp actuel en secondes

    if (!decoded.exp || decoded.exp < now) {
      return "recharge"; // token expiré
    }

    const expiryDate = new Date(decoded.exp * 1000);
    const month = String(expiryDate.getMonth() + 1).padStart(2, "0");
    const year = String(expiryDate.getFullYear()).slice(-2); // deux derniers chiffres

    return `${month}/${year}`; // ex: "01/26"
  } catch (err) {
    console.log(err)
    return "recharge"; // token invalide
  }
}
