"use client";

import { useLayoutEffect } from "react";

export function ThemeInitializer() {
  useLayoutEffect(() => {
    const theme = localStorage.getItem("figurinha-theme") || "dark";
    document.documentElement.dataset.theme = theme;
  }, []);

  return null;
}
