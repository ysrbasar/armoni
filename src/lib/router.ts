import { useSyncExternalStore } from "react";

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

const getPath = () => {
  const h = window.location.hash.replace(/^#/, "");
  return h.startsWith("/") ? h : "/";
};

export const usePath = () => useSyncExternalStore(subscribe, getPath, () => "/");

export const navigate = (path: string) => {
  if (getPath() === path) return;
  window.location.hash = path;
  window.scrollTo({ top: 0 });
};

export const segments = (path: string) => path.split("/").filter(Boolean);
