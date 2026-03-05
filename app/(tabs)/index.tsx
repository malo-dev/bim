/* eslint-disable @typescript-eslint/no-unused-vars */
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useTranslation } from "react-i18next";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  StatusBar,
  Text,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useGetAllSectorsQuery } from "@/services/sectorsServices";
import { ThemedText } from "@/components/themed-text";
import HeaderOFpage from "@/components/ui/headerHome";
import HeaderRow from "@/components/ui/headerTextUi";
import { API_URL_BASE } from "@/constants/api";
import { useGetUserByIdQuery } from "@/services/userService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useRouter } from "expo-router";
import Modal from "react-native-modal";
import { useDispatch } from "react-redux";
import { setSectors } from "@/services/globalApi";
import { Ionicons } from "@expo/vector-icons";
import { C, Colors } from "@/constants/theme";

/* ─── Hook thème (même pattern qu'Onboarding) ───────────────────────── */
function useTheme() {
  const scheme = useColorScheme();
  const isDark = scheme === "dark";
  return { isDark, t: isDark ? Colors.dark : Colors.light };
}

/* ─── QUICK ACTIONS ──────────────────────────────────────────────────── */
const QUICK_ACTIONS = [
  { titleKey: "home.recharge",  icon: "circle-plus",        color: C.primary, route: "/recharge"  },
  { titleKey: "home.withdraw",  icon: "money-bill-transfer", color: C.red,     route: "/retrait"   },
  { titleKey: "home.transfer",  icon: "right-left",          color: C.primary, route: "/transfert" },
  { titleKey: "home.scanner",   icon: "qrcode",              color: C.violet,  route: "/qrcode"    },
  { titleKey: "home.support",   icon: "headset",             color: C.primary, route: "/support"   },
  { titleKey: "home.refresh",   icon: "arrows-rotate",       color: C.accent,  route: null         },
] as const;

/* ─── SECTOR COLORS ──────────────────────────────────────────────────── */
const SECTOR_COLORS = ["#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#EC4899"];

/* ─── FULL SCREEN LOADER ─────────────────────────────────────────────── */
const FullScreenLoader = () => {
  const { t: tr } = useTranslation();
  return (
    <View style={s.loaderWrap}>
      <LinearGradient colors={[C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={C.white} />
      <Text style={s.loaderText}>{tr("common.loading")}</Text>
    </View>
  );
};

/* ─── ACTION BUTTON ──────────────────────────────────────────────────── */
type ActionButtonProps = {
  title: string;
  icon: React.ComponentProps<typeof FontAwesome6>["name"];
  color?: string;
  onPress?: () => void;
  index?: number;
  isDark?: boolean;
  cardBg?: string;
};

const ActionButton: React.FC<ActionButtonProps> = ({
  title, icon, color = C.primary, onPress, index = 0, isDark = false, cardBg,
}) => {
  const scale  = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 300, delay: index * 50, useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 300, delay: index * 50, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      style={s.btnWrapper}
      onPress={onPress}
      activeOpacity={1}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View
        style={[
          s.btn,
          { backgroundColor: cardBg || (isDark ? "#1E2A3A" : C.f4) },
          { opacity: opac, transform: [{ translateY: slideY }, { scale }] },
        ]}
      >
        <View style={[s.iconCircle, { backgroundColor: color + "22" }]}>
          <FontAwesome6 name={icon} size={20} color={color} />
        </View>
        <Text style={[s.actionText, { color: isDark ? "#CBD5E1" : C.black }]}>
          {title}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/* ─── SECTOR BUTTON ──────────────────────────────────────────────────── */
const SectorButton = ({
  sector, index, onPress, isDark,
}: {
  sector: any; index: number; onPress: () => void; isDark: boolean;
}) => {
  const color  = SECTOR_COLORS[index % SECTOR_COLORS.length];
  const scale  = useRef(new Animated.Value(1)).current;
  const slideY = useRef(new Animated.Value(20)).current;
  const opac   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideY, { toValue: 0, duration: 350, delay: index * 60, useNativeDriver: true }),
      Animated.timing(opac,   { toValue: 1, duration: 350, delay: index * 60, useNativeDriver: true }),
    ]).start();
  }, []);

  const pressIn  = () => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start();
  const pressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true }).start();

  return (
    <TouchableOpacity
      style={s.btnWrapper}
      onPress={onPress}
      activeOpacity={1}
      onPressIn={pressIn}
      onPressOut={pressOut}
    >
      <Animated.View
        style={[
          s.sectorBtn,
          { backgroundColor: isDark ? "#1E2A3A" : C.f4 },
          { opacity: opac, transform: [{ translateY: slideY }, { scale }] },
        ]}
      >
        <View style={[s.sectorAccent, { backgroundColor: color }]} />
        <View style={[s.sectorIconCircle, { backgroundColor: color + "22" }]}>
          <FontAwesome6 name="layer-group" size={18} color={color} />
        </View>
        <Text
          style={[s.sectionLabel, { color: isDark ? "#CBD5E1" : C.text }]}
          numberOfLines={2}
        >
          {sector.name}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/* ─── HOME SCREEN ────────────────────────────────────────────────────── */
export default function HomeScreen() {
  const router   = useRouter();
  const dispatch = useDispatch();
  const { isDark, t } = useTheme();
  const { t: tr } = useTranslation();

  const [userId,     setUserId]     = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [openScanner, setOpenScanner] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const { data: sectorsData } = useGetAllSectorsQuery({
    page: 1, pageSize: 20, search: "", paginate: false,
  });

  const {
    data: user, isLoading, isFetching, isUninitialized, isError, refetch,
  } = useGetUserByIdQuery(userId!, { skip: !userId });

  useEffect(() => {
    AsyncStorage.getItem("userId").then(setUserId);
  }, []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  const onRefresh = async () => {
    try { setRefreshing(true); await refetch(); }
    finally { setRefreshing(false); }
  };

  const handleGoto = (item: any) => {
    dispatch(setSectors([item]));
    router.push(`/service/${item.businessId}`);
  };

  const sectors = (sectorsData?.data || []).slice(0, 6);

  if (isUninitialized || isLoading || isFetching) return <FullScreenLoader />;

  if (isError) return (
    <View style={s.loaderWrap}>
      <LinearGradient colors={[C.deep, C.primary]} style={StyleSheet.absoluteFill} />
      <Ionicons name="cloud-offline-outline" size={48} color="rgba(255,255,255,0.5)" />
      <Text style={s.loaderText}>{tr("common.internet")}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: isDark ? t.background : C.bg }]} edges={["top"]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.white}
          />
        }
      >
        {/* ── HEADER ── */}
        <HeaderOFpage
          username={user?.username}
          tokenAbonement={user?.TokenAbonemment}
          soldNumber={user?.soldNumber}
          avatar={
            user?.imageUrl
              ? user.imageUrl.startsWith("http") ? user.imageUrl : `${API_URL_BASE}${user.imageUrl}`
              : undefined
          }
          accountNumber={user?.accountNumber}
        />

        {/* ── QUICK ACTIONS CARD ── */}
        <View style={[
          s.quickCard,
          {
            backgroundColor: isDark ? t.card : C.white,
            shadowColor: isDark ? "#000" : C.primary,
          },
        ]}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: C.accent }]} />
            <Text style={[s.sectionLabelHeader, { color: isDark ? t.textSecondary : C.muted }]}>
              {tr("home.quickActions")}
            </Text>
          </View>

          <View style={s.grid}>
            {QUICK_ACTIONS.map((action, i) => (
              <ActionButton
                key={action.titleKey}
                title={tr(action.titleKey)}
                icon={action.icon as any}
                color={action.color}
                index={i}
                isDark={isDark}
                onPress={
                  action.route === null
                    ? onRefresh
                    : () => router.push(action.route as any)
                }
              />
            ))}
          </View>
        </View>

        {/* ── MAIN CARD ── */}
        <View style={[
          s.mainCard,
          {
            backgroundColor: isDark ? t.card : C.white,
            shadowColor: isDark ? "#000" : "#000",
          },
        ]}>
          <HeaderRow />

          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: C.primary }]} />
            <Text style={[s.sectionLabelHeader, { color: isDark ? t.textSecondary : C.muted }]}>
              {tr("home.sectors")}
            </Text>
          </View>

          {/* Scanner modal */}
          <Modal
            isVisible={openScanner}
            style={{ margin: 0 }}
            onBackdropPress={() => setOpenScanner(false)}
          >
            <View style={{ flex: 1, backgroundColor: "#000" }}>
              <CameraView
                style={{ flex: 1 }}
                barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
              />
              <TouchableOpacity
                style={s.closeScanner}
                onPress={() => setOpenScanner(false)}
              >
                <Ionicons name="close" size={28} color={C.white} />
              </TouchableOpacity>
            </View>
          </Modal>

          {/* Sectors grid */}
          <View style={s.grid}>
            {sectors.map((sector: any, i: number) => (
              <SectorButton
                key={sector.businessId}
                sector={sector}
                index={i}
                isDark={isDark}
                onPress={() => handleGoto(sector)}
              />
            ))}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── STYLES ─────────────────────────────────────────────────────────── */
const s = StyleSheet.create({
  safe: { flex: 1 },

  loaderWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    color: C.white,
    fontFamily: "NexaLight",
    marginTop: 12,
    fontSize: 13,
  },

  quickCard: {
    marginHorizontal: 16,
    marginTop: -24,
    borderRadius: 24,
    padding: 16,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },

  mainCard: {
    marginTop: 20,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    minHeight: "70%",
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    marginTop: 4,
  },
  sectionDot: {
    width: 4, height: 16, borderRadius: 2,
  },
  sectionLabelHeader: {
    fontFamily: "NexaLight",
    fontSize: 13,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "NexaLight",
    textAlign: "center",
    paddingHorizontal: 4,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  btnWrapper: { width: "30%", marginBottom: 12 },

  btn: {
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },

  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
  },

  actionText: {
    fontSize: 11,
    fontFamily: "NexaLight",
    textAlign: "center",
  },

  sectorBtn: {
    borderRadius: 18,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 4,
    overflow: "hidden",
  },

  sectorAccent: {
    position: "absolute", top: 0, left: 0, right: 0,
    height: 3,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },

  sectorIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 7,
    marginTop: 4,
  },

  closeScanner: {
    position: "absolute",
    top: 50, right: 20,
    width: 44, height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});