/* eslint-disable */
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetAllTransactionsQuery } from "@/services/tsxService";
import { useAppTheme } from "@/app/_layout";

/* ─── PALETTE ────────────────────────────────────────────────────────── */
const LIGHT = {
  primary: "#0035C5",
  text:    "#1A1C1C",
  textSec: "#434657",
  textMut: "#747688",
  bg:      "#F9F9F9",
  white:   "#FFFFFF",
  green:   "#10B981",
  red:     "#EF4444",
  amber:   "#F59E0B",
  border:  "rgba(196,197,218,0.30)",
};
const DARK: typeof LIGHT = {
  primary: "#4D8DFF",
  text:    "#EAF0FF",
  textSec: "#C5D0E8",
  textMut: "#9FB0D0",
  bg:      "#0B1220",
  white:   "#FFFFFF",
  green:   "#22C55E",
  red:     "#FF5A5A",
  amber:   "#F59E0B",
  border:  "rgba(31,42,68,0.80)",
};

/* ─── TYPES ──────────────────────────────────────────────────────────── */
type FilterType = "Tout" | "Reçu" | "Envoyé" | "Retrait" | "Recharge" | "Paiement";
type SortType   = "recent" | "ancien" | "montant_desc" | "montant_asc";

const FILTERS: { value: FilterType; label: string }[] = [
  { value: "Tout",     label: "Tout"     },
  { value: "Reçu",     label: "Reçu"     },
  { value: "Envoyé",   label: "Envoyé"   },
  { value: "Retrait",  label: "Retrait"  },
  { value: "Recharge", label: "Recharge" },
  { value: "Paiement", label: "Paiement" },
];

const SORTS: { value: SortType; label: string }[] = [
  { value: "recent",       label: "Plus récent"  },
  { value: "ancien",       label: "Plus ancien"  },
  { value: "montant_desc", label: "Montant ↓"    },
  { value: "montant_asc",  label: "Montant ↑"    },
];

function getTxType(tx: any): FilterType {
  const t = (tx.type ?? "").toLowerCase();
  if (t === "recharge")          return "Recharge";
  if (t === "retrait")           return "Retrait";
  if (t === "reception")         return "Reçu";
  if (t === "transfert")         return "Envoyé";
  if (t === "paiement" || t === "payment") return "Paiement";
  if (tx.amount > 0 && (tx.description ?? "").toLowerCase().includes("reçu")) return "Reçu";
  return "Paiement";
}

function getTxIcon(type: FilterType, C: typeof LIGHT): { name: any; bg: string; color: string } {
  switch (type) {
    case "Reçu":     return { name: "arrow-down-outline",    bg: "rgba(16,185,129,0.10)", color: C.green  };
    case "Envoyé":   return { name: "arrow-up-outline",      bg: "rgba(77,141,255,0.10)", color: C.primary };
    case "Retrait":  return { name: "wallet-outline",         bg: "rgba(245,158,11,0.10)", color: C.amber  };
    case "Recharge": return { name: "add-circle-outline",     bg: "rgba(16,185,129,0.10)", color: C.green  };
    case "Paiement": return { name: "bag-outline",            bg: "rgba(77,141,255,0.10)", color: C.primary };
    default:         return { name: "swap-horizontal-outline",bg: "rgba(77,141,255,0.10)", color: C.primary };
  }
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── TRANSACTION ITEM ───────────────────────────────────────────────── */
function TxCard({ tx }: { tx: any }) {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);
  const type    = getTxType(tx);
  const icon    = getTxIcon(type, C);
  const amount  = Number(tx.amount ?? tx.montant ?? 0);
  const isIn    = type === "Reçu" || type === "Recharge";
  const label   = tx.description || (isIn ? "Transfert reçu" : type);
  const date    = formatDate(tx.createdAt);
  const success = (tx.status ?? "success") !== "failed";

  return (
    <View style={s.txCard}>
      <View style={[s.txIcon, { backgroundColor: icon.bg }]}>
        <Ionicons name={icon.name} size={20} color={icon.color} />
      </View>
      <View style={s.txBody}>
        <Text style={s.txLabel} numberOfLines={1}>{label}</Text>
        <Text style={s.txDate}>{date}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[s.txAmount, { color: isIn ? C.green : C.text }]}>
          {isIn ? "+" : "-"}{amount.toFixed(2)} EC
        </Text>
        <Text style={[s.txStatus, { color: success ? C.green : C.red }]}>
          {success ? "Succès" : "Échoué"}
        </Text>
      </View>
    </View>
  );
}

/* ─── SCREEN ─────────────────────────────────────────────────────────── */
export default function HistoryScreen() {
  const { isDark } = useAppTheme();
  const C = isDark ? DARK : LIGHT;
  const s = useMemo(() => mkS(C), [isDark]);

  const router = useRouter();
  const [userId,      setUserId]      = useState<string | null>(null);
  const [filter,      setFilter]      = useState<FilterType>("Tout");
  const [sort,        setSort]        = useState<SortType>("recent");
  const [search,      setSearch]      = useState("");
  const [showSortMenu,setShowSortMenu]= useState(false);

  useEffect(() => { AsyncStorage.getItem("userId").then(setUserId); }, []);

  const { data, isLoading, refetch } = useGetAllTransactionsQuery(
    { userId, page: 1, pageSize: 100 },
    { skip: !userId }
  );

  const allTx: any[] = data?.data || [];

  const filtered = useMemo(() => {
    let list = [...allTx];

    if (search.length >= 2) {
      const q = search.toLowerCase();
      list = list.filter(tx =>
        (tx.description ?? "").toLowerCase().includes(q) ||
        (tx.type ?? "").toLowerCase().includes(q)
      );
    }

    if (filter !== "Tout") {
      list = list.filter(tx => getTxType(tx) === filter);
    }

    switch (sort) {
      case "recent":
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "ancien":
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "montant_desc":
        list.sort((a, b) => Number(b.amount ?? 0) - Number(a.amount ?? 0));
        break;
      case "montant_asc":
        list.sort((a, b) => Number(a.amount ?? 0) - Number(b.amount ?? 0));
        break;
    }

    return list;
  }, [allTx, filter, sort, search]);

  const currentSortLabel = SORTS.find(s => s.value === sort)?.label ?? "Trier";

  const ListHeader = () => (
    <View>
      {/* ── SEARCH + SORT ──────────────────────────────────────────── */}
      <View style={s.searchWrap}>
        <View style={s.searchBox}>
          <Ionicons name="search-outline" size={16} color={C.textMut} />
          <TextInput
            placeholder="Rechercher une transaction..."
            placeholderTextColor={C.textMut}
            value={search}
            onChangeText={setSearch}
            style={s.searchInput}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={16} color={C.textMut} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={s.sortBtn} onPress={() => setShowSortMenu(v => !v)}>
          <Ionicons name="funnel-outline" size={16} color={C.primary} />
          <Text style={s.sortBtnText}>{currentSortLabel}</Text>
          <Ionicons name={showSortMenu ? "chevron-up" : "chevron-down"} size={14} color={C.primary} />
        </TouchableOpacity>
      </View>

      {/* ── SORT DROPDOWN ──────────────────────────────────────────── */}
      {showSortMenu && (
        <View style={s.sortMenu}>
          {SORTS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[s.sortOption, sort === opt.value && s.sortOptionActive]}
              onPress={() => { setSort(opt.value); setShowSortMenu(false); }}
            >
              <Text style={[s.sortOptionText, sort === opt.value && { color: C.white }]}>
                {opt.label}
              </Text>
              {sort === opt.value && <Ionicons name="checkmark" size={14} color={C.white} />}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── FILTER PILLS ───────────────────────────────────────────── */}
      <View style={s.pillsWrap}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.value}
            style={[s.pill, filter === f.value && s.pillActive]}
            onPress={() => setFilter(f.value)}
            activeOpacity={0.8}
          >
            <Text style={[s.pillText, filter === f.value && s.pillTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* ── TOP BAR ──────────────────────────────────────────────────── */}
      <SafeAreaView edges={["top"]} style={{ backgroundColor: "rgba(255,255,255,0.90)" }}>
        <View style={s.topBar}>
          <TouchableOpacity style={s.iconBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={C.text} />
          </TouchableOpacity>
          <Text style={s.topTitle}>Historique</Text>
          <TouchableOpacity style={s.iconBtn} onPress={() => refetch()}>
            <Ionicons name="refresh-outline" size={20} color={C.primary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* ── LIST + HEADER ────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item, i) => `${item.id ?? "tx"}-${i}`}
          ListHeaderComponent={<ListHeader />}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <View style={s.center}>
              <Ionicons name="receipt-outline" size={40} color={C.textMut} />
              <Text style={s.emptyText}>Aucune transaction trouvée</Text>
            </View>
          }
          renderItem={({ item }) => <TxCard tx={item} />}
        />
      )}
    </View>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
function mkS(C: typeof LIGHT) { return StyleSheet.create({
  topBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.18)",
  },
  iconBtn:  { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  topTitle: { fontFamily: "NexaBold", fontSize: 17, color: C.text },

  searchWrap: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingTop: 14 },
  searchBox: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.white, borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(196,197,218,0.30)",
    paddingHorizontal: 12, height: 44,
    elevation: 2, shadowColor: "#0035C5", shadowOpacity: 0.03, shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: "NexaLight", color: C.text },
  sortBtn: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(0,53,197,0.06)",
    borderRadius: 12, paddingHorizontal: 10, height: 44,
    borderWidth: 1, borderColor: "rgba(0,53,197,0.10)",
  },
  sortBtnText: { fontFamily: "NexaBold", fontSize: 11, color: C.primary },

  sortMenu: {
    marginHorizontal: 16, marginTop: 6,
    backgroundColor: C.white, borderRadius: 16,
    borderWidth: 1, borderColor: "rgba(196,197,218,0.30)",
    overflow: "hidden",
    elevation: 8, shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
  },
  sortOption: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, borderBottomColor: "rgba(196,197,218,0.15)",
  },
  sortOptionActive: { backgroundColor: C.primary },
  sortOptionText:   { fontFamily: "NexaBold", fontSize: 13, color: C.text },

  pillsWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 16, paddingTop: 10, paddingBottom: 14, gap: 8 },
  pill:      { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 24, backgroundColor: C.white, borderWidth: 1.5, borderColor: "rgba(100,110,180,0.35)" },
  pillActive:    { backgroundColor: C.primary, borderColor: C.primary },
  pillText:      { fontFamily: "NexaBold", fontSize: 12, color: C.textSec },
  pillTextActive:{ color: C.white },

  list: { paddingHorizontal: 16, paddingBottom: 40, paddingTop: 4 },

  txCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(255,255,255,0.70)",
    borderRadius: 22, padding: 16,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.80)",
    elevation: 2, shadowColor: "#000", shadowOpacity: 0.03, shadowRadius: 20, shadowOffset: { width: 0, height: 6 },
  },
  txIcon:   { width: 46, height: 46, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  txBody:   { flex: 1 },
  txLabel:  { fontFamily: "NexaBold", fontSize: 13, color: C.text },
  txDate:   { fontFamily: "NexaLight", fontSize: 10, color: C.textMut, marginTop: 3, textTransform: "uppercase", letterSpacing: 0.5 },
  txAmount: { fontFamily: "NexaBold", fontSize: 15 },
  txStatus: { fontFamily: "NexaLight", fontSize: 9, textTransform: "uppercase", letterSpacing: 0.5, marginTop: 2 },

  center:    { flex: 1, alignItems: "center", justifyContent: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontFamily: "NexaLight", fontSize: 14, color: C.textMut },
}); }
