import { useState } from "react";

export const useUserSession = () => {
  const [userId, setUserId] = useState<string | null>(null);

  return {
    userId,
    setUserId,
  };
};
