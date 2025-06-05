'use client';

import { Provider } from "react-redux";
import { store } from "./store";
import { use } from "react";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <Provider store={store}>{children}</Provider>;
}
