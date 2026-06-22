"use client";

import { Network } from "@capacitor/network";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface NetworkContextValue {
  isOnline: boolean;
  initialized: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({
  isOnline: true,
  initialized: false,
});

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<NetworkContextValue>({
    isOnline: true,
    initialized: false,
  });

  useEffect(() => {
    let active = true;
    let removeListener: (() => Promise<void>) | undefined;

    void Network.getStatus().then((status) => {
      if (active) setState({ isOnline: status.connected, initialized: true });
    });

    void Network.addListener("networkStatusChange", (status) => {
      if (active) setState({ isOnline: status.connected, initialized: true });
    }).then((handle) => {
      removeListener = () => handle.remove();
    });

    return () => {
      active = false;
      void removeListener?.();
    };
  }, []);

  const value = useMemo(() => state, [state]);
  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetworkStatus(): NetworkContextValue {
  return useContext(NetworkContext);
}
