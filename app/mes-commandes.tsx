/** Ancienne page « Mes commandes » : redirige vers la nouvelle (design BIM NEXT). */
import { Redirect } from "expo-router";
import React from "react";

export default function MesCommandesRedirect() {
  return <Redirect href={"/commandes" as any} />;
}
