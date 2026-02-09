import { ArrowIcon, ArrowRightIcon } from "@/assets/svg/ArrowIcon";
import GradientButton from "@/components/ui/GradientButton";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  useCreateTransfertMutation
} from "@/services/tsxService";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { normalizeDecimal } from "@/utils/normalizeDecimal.util";

import React, { useEffect, useState } from "react";
import { useGetAllUsersQuery } from "@/services/userService";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";

// Définition du type utilisateur
interface User {
  id: number | string;
  username: string;
  email?: string;
  role?: any;
  branchTrack?: any;
  commerce?: any;
}

export default function TransferEcoinsScreen() {
  const router = useRouter();

    const [createTransfert, { isLoading }] = useCreateTransfertMutation();
    
    const [userId, setUserId] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [users, setUsers] = useState<User[]>([]);


    useEffect(() => {
      const loadUser = async () => {
        const id = await AsyncStorage.getItem("userId");
        setUserId(id);
      };
      loadUser();
    }, []);
  // Hook RTK Query
  const { data, isFetching, refetch } = useGetAllUsersQuery({
    search: searchQuery,
    page,
    pageSize: 20,
    paginate: true,
  });

  // Effet pour ajouter les utilisateurs récupérés
  useEffect(() => {
    if (data?.data) {
      if (page === 1) setUsers(data.data);
      else setUsers((prev) => [...prev, ...data.data]);
    }
  }, [data, page]);

  // Chargement page suivante
  const loadMore = () => {
    if (!isFetching && data?.pagination?.page < data?.pagination?.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

// Confirmer le transfert
const handleConfirm = async () => {
  if (!selectedUser || !amount) {
    alert("Veuillez choisir un utilisateur et entrer un montant.");
    return;
  }

  try {
    // Appel à l'API de transfert
    const transfertResponse: any = await createTransfert({
      amount: normalizeDecimal(amount),
      targetId: selectedUser.id,
      id: userId,
      // PayTypeValue: selectedMethod (si besoin)
    }).unwrap();

    if (transfertResponse) {
      alert(`Vous avez transféré ${amount} Ecoins à ${selectedUser.username}`);
    } else {
      alert("Échec du transfert : erreur inconnue.");
    }

    // Reset des champs
    setSelectedUser(null);
    setAmount("");
    setSearchQuery("");
    setPage(1);
    Keyboard.dismiss();
  } catch (err: any) {
    console.error(err);
    alert(
      err?.data?.message || "Une erreur est survenue lors du transfert."
    );
  }
};


const handleSelectTrans = (item:any) =>{
  setSearchQuery(item?.username);
  setSelectedUser(item)
}

  // Rendu d'un utilisateur
  const renderUser = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUser?.id === item.id && styles.userItemSelected,
      ]}
      onPress={() => handleSelectTrans(item)}
    >
      <Text style={styles.userName}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      {/* HEADER */}
      <LinearGradient colors={["#302E99", "#3906C7"]} style={styles.header}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={26} color="white" />
          </TouchableOpacity>

          <Text style={styles.title}>Transfert Ecoins</Text>

          <Ionicons name="notifications-outline" size={24} color="white" />
        </View>

        <Ionicons name="swap-horizontal-outline" size={60} color="white" />
        <Text style={styles.subtitle}>
          Envoyer des Ecoins à un utilisateur
        </Text>
      </LinearGradient>

      {/* BODY */}
      <View style={styles.body}>
        {/* SEARCH */}
        <Text style={styles.label}>Utilisateur destinataire</Text>
        <TextInput
          placeholder="Rechercher un utilisateur"
          style={styles.input}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            setPage(1);
            refetch();
          }}
        />

        {/* USERS LIST */}
        <FlatList
          data={users}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderUser}
          style={{ maxHeight: 300 }}
          keyboardShouldPersistTaps="handled"
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetching ? <ActivityIndicator size="small" color="#3906C7" /> : null
          }
        />

        {/* AMOUNT */}
        <Text style={styles.label}>Montant</Text>
        <View style={styles.amountBox}>
          <Ionicons name="cash-outline" size={20} color="#777" />
          <TextInput
            placeholder="Ex: 50"
            keyboardType="numeric"
            style={styles.amountInput}
            value={amount}
            onChangeText={setAmount}
            returnKeyType="done"
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>

        {/* BUTTON */}
        <View style={{ marginTop: 30 }}>
          <GradientButton
          isLoad={isLoading}
            title="Confirmer le transfert"
            onPress={handleConfirm}
            leftIcon={<ArrowIcon width={18} height={14} color="#3906C7" />}
            rightIcon={<ArrowRightIcon width={26} height={24} />}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    alignItems: "center",
  },
  headerRow: {
    marginTop: 60,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: { color: "white", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "white", opacity: 0.9, marginTop: 8 },
  body: { flex: 1, padding: 16 },
  label: { marginTop: 20, marginBottom: 6, fontWeight: "600", color: "#333" },
  input: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#CCC",
  },
  userItem: {
    backgroundColor: "#EEE",
    padding: 12,
    borderRadius: 10,
    marginVertical: 4,
  },
  userItemSelected: {
    backgroundColor: "#DDE0FF",
    borderWidth: 2,
    borderColor: "#FFD700",
  },
  userName: { fontWeight: "600", color: "#333" },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EEE",
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
});
