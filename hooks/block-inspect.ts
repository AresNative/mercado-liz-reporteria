// hooks/block-inspect.ts
"use client";
import { useEffect } from "react";

const useBlockInspect = (options = {}) => {
  const {
    blockKeyShortcuts = true,
    blockContextMenu = true,
    blockDevTools = false,
    redirectUrl = "/access-denied",
  }: any = options;

  useEffect(() => {
    // Bloquear teclas
    if (blockKeyShortcuts) {
      const handleKeyDown = (e: any) => {
        const forbiddenKeys = [
          e.key === "F12",
          e.ctrlKey && e.shiftKey && e.key === "I",
          e.ctrlKey && e.shiftKey && e.key === "C",
          e.ctrlKey && e.key === "u",
          e.ctrlKey && e.shiftKey && e.key === "J",
          e.ctrlKey && e.key === "s",
        ];

        if (forbiddenKeys.some(Boolean)) {
          e.preventDefault();
          return false;
        }
      };

      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [blockKeyShortcuts]);

  useEffect(() => {
    // Bloquear click derecho
    if (blockContextMenu) {
      const handleContextMenu = (e: any) => {
        e.preventDefault();
        return false;
      };

      window.addEventListener("contextmenu", handleContextMenu);

      return () => {
        window.removeEventListener("contextmenu", handleContextMenu);
      };
    }
  }, [blockContextMenu]);

  useEffect(() => {
    // Detectar dev tools
    if (blockDevTools) {
      let interval;

      const detectDevTools = () => {
        const threshold = 200;
        const widthDiff = Math.abs(window.outerWidth - window.innerWidth);
        const heightDiff = Math.abs(window.outerHeight - window.innerHeight);

        if (widthDiff > threshold || heightDiff > threshold) {
          window.location.href = redirectUrl;
        }
      };

      interval = setInterval(detectDevTools, 1000);

      return () => {
        clearInterval(interval);
      };
    }
  }, [blockDevTools, redirectUrl]);
};

export default useBlockInspect;
