// Les codes eux-mêmes sont gérés depuis admin-bim (table `access_codes`,
// endpoint /access-code/verify) — plus codés en dur ici, pour pouvoir les
// changer sans publier une nouvelle version de l'app.
export type StaffRole = "BIM" | "LIVREUR" | "CHAUFFEUR";
