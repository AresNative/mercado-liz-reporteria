"use client";

import { Provider } from "react-redux";
import { store } from "./store";
import useBlockInspect from "./block-inspect";

export default function Providers({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

    /* useBlockInspect({
      blockKeyShortcuts: true,
      blockContextMenu: true,
      blockDevTools: true,
      redirectUrl: '/acceso-denegado'
    }); */
  
  return <Provider store={store}>{children}</Provider>;
}
