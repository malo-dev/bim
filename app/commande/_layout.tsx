import { Stack } from "expo-router";
import { useTh } from "@/components/bim/theme";

export default function CommandeLayout() {
  const th = useTh();
  return <Stack screenOptions={{ headerShown: false, animation: "fade", animationDuration: 260, contentStyle: { backgroundColor: th.base } }} />;
}
