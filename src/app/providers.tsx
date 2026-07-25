"use client";

import { Provider } from "react-redux";
import { ConfigProvider } from "antd";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { store } from "@/lib/store";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

type ProvidersProps = {
  children: React.ReactNode;
};

export default function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: "#d6a27a",
          },
          components: {
            Calendar: {
              itemActiveBg: "#FFF",
            },
          },
        }}
      >
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {children}
        </GoogleOAuthProvider>
      </ConfigProvider>
    </Provider>
  );
}
