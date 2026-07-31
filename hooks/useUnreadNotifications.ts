import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useGetAllNotificationsQuery } from "@/services/notificationService";

export function useUnreadNotifications() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem("userId").then(id => { if (id) setUserId(id); });
  }, []);

  const { data } = useGetAllNotificationsQuery(
    userId ? { userId, isRead: "false", pageSize: 1, paginate: "true" } : null,
    { skip: !userId, pollingInterval: 30000 }
  );

  const unread = (data?.total ?? 0) as number;
  return { unread };
}
