"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AdminRole, QuoteItem, ThemePreference } from "../lib/data";

export type Palette = "sky" | "galaxy";
export type DisplayMode = "light" | "dark" | "system";

type SiteContextValue = {
  session: { displayName: string; role: AdminRole | null; provider: "credential" | "google" } | null;
  basket: QuoteItem[];
  basketCount: number;
  basketActivity: number;
  addItem: (productSlug: string, quantity?: number, note?: string, productName?: string) => void;
  updateItem: (productSlug: string, quantity: number, note?: string) => void;
  removeItem: (productSlug: string) => void;
  clearBasket: () => void;
  palette: Palette;
  mode: DisplayMode;
  reducedMotion: boolean;
  setPalette: (palette: Palette) => void;
  setMode: (mode: DisplayMode) => void;
  setReducedMotion: (value: boolean) => void;
  resetTheme: () => void;
};

const SiteContext = createContext<SiteContextValue | null>(null);
const BASKET_KEY = "sparks_quote_v1";
const PALETTE_KEY = "sparks_palette_v1";
const MODE_KEY = "sparks_mode_v1";
const MOTION_KEY = "sparks_motion_v1";

function isPalette(value: unknown): value is Palette {
  return value === "sky" || value === "galaxy";
}

function isMode(value: unknown): value is DisplayMode {
  return value === "light" || value === "dark" || value === "system";
}

export function SiteProvider({ children, initialPreference, signedIn = false }: { children: ReactNode; initialPreference?: ThemePreference; signedIn?: boolean }) {
  const initialPalette = initialPreference?.palette;
  const initialMode = initialPreference?.mode;
  const initialReducedMotion = Boolean(initialPreference?.reducedMotion);
  const [basket, setBasket] = useState<QuoteItem[]>([]);
  const [basketActivity, setBasketActivity] = useState(0);
  const [basketAnnouncement, setBasketAnnouncement] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [paletteState, setPaletteState] = useState<Palette>(initialPalette || "sky");
  const [modeState, setModeState] = useState<DisplayMode>(initialMode || "system");
  const [reducedMotion, setReducedMotionState] = useState(initialReducedMotion);
  const [signedInState, setSignedInState] = useState(signedIn);
  const [session, setSession] = useState<SiteContextValue["session"]>(null);

  useEffect(() => {
    let savedItems: QuoteItem[] = [];
    try {
      const savedBasket = JSON.parse(localStorage.getItem(BASKET_KEY) || "[]") as QuoteItem[];
      if (Array.isArray(savedBasket)) {
        savedItems = savedBasket.filter(
          (item) =>
            typeof item.productSlug === "string" &&
            Number.isFinite(item.quantity) &&
            item.quantity > 0,
        );
      }
    } catch {
      localStorage.removeItem(BASKET_KEY);
    }

    const savedPalette = localStorage.getItem(PALETTE_KEY);
    const savedMode = localStorage.getItem(MODE_KEY);
    const savedMotion = localStorage.getItem(MOTION_KEY);
    const nextPalette: Palette = signedIn && isPalette(initialPalette)
      ? initialPalette
      : isPalette(savedPalette) ? savedPalette : "sky";
    const nextMode: DisplayMode = signedIn && isMode(initialMode)
      ? initialMode
      : isMode(savedMode) ? savedMode : "system";
    const nextReducedMotion = signedIn
      ? initialReducedMotion
      : savedMotion === "reduced";
    const effectiveMode = nextMode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : nextMode;

    document.documentElement.dataset.palette = nextPalette;
    document.documentElement.dataset.mode = effectiveMode;
    document.documentElement.dataset.motion = nextReducedMotion ? "reduced" : "full";
    localStorage.setItem(PALETTE_KEY, nextPalette);
    localStorage.setItem(MODE_KEY, nextMode);
    localStorage.setItem(MOTION_KEY, nextReducedMotion ? "reduced" : "full");
    queueMicrotask(() => {
      setBasket(savedItems);
      setPaletteState(nextPalette);
      setModeState(nextMode);
      setReducedMotionState(nextReducedMotion);
      setHydrated(true);
    });
  }, [initialMode, initialPalette, initialReducedMotion, signedIn]);

  useEffect(() => {
    let active = true;
    void fetch("/api/account", { headers: { accept: "application/json" } }).then(async (response) => {
      if (!active || !response.ok) return;
      const account = await response.json() as {
        member: { displayName: string };
        adminRole: AdminRole | null;
        provider: "credential" | "google";
        themePreference?: ThemePreference;
      };
      if (!active) return;
      setSignedInState(true);
      setSession({ displayName: account.member.displayName, role: account.adminRole, provider: account.provider });
      const preference = account.themePreference;
      if (preference && isPalette(preference.palette) && isMode(preference.mode)) {
        const effectiveMode = preference.mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : preference.mode;
        setPaletteState(preference.palette);
        setModeState(preference.mode);
        setReducedMotionState(Boolean(preference.reducedMotion));
        document.documentElement.dataset.palette = preference.palette;
        document.documentElement.dataset.mode = effectiveMode;
        document.documentElement.dataset.motion = preference.reducedMotion ? "reduced" : "full";
        localStorage.setItem(PALETTE_KEY, preference.palette);
        localStorage.setItem(MODE_KEY, preference.mode);
        localStorage.setItem(MOTION_KEY, preference.reducedMotion ? "reduced" : "full");
      }
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      document.documentElement.dataset.mode = modeState === "system"
        ? media.matches ? "dark" : "light"
        : modeState;
    };
    apply();
    if (modeState !== "system") return;
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [modeState]);

  const persistPreference = useCallback((preference: ThemePreference) => {
    if (signedInState) void fetch("/api/account/theme", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(preference) });
  }, [signedInState]);

  useEffect(() => {
    if (hydrated) localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
  }, [basket, hydrated]);

  const addItem = useCallback((productSlug: string, quantity = 1, note?: string, productName?: string) => {
    setBasketActivity((value) => value + 1);
    setBasketAnnouncement("");
    queueMicrotask(() => setBasketAnnouncement(`${productName || "Item"} added to quote basket.`));
    setBasket((items) => {
      const existing = items.find((item) => item.productSlug === productSlug);
      if (existing) {
        return items.map((item) =>
          item.productSlug === productSlug
            ? {
                ...item,
                quantity: Math.min(999, item.quantity + Math.max(1, quantity)),
                note: note || item.note,
              }
            : item,
        );
      }
      return [...items, { productSlug, quantity: Math.max(1, quantity), note }];
    });
  }, []);

  const updateItem = useCallback((productSlug: string, quantity: number, note?: string) => {
    setBasket((items) =>
      items.map((item) =>
        item.productSlug === productSlug
          ? { ...item, quantity: Math.min(999, Math.max(1, quantity)), note }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((productSlug: string) => {
    setBasket((items) => items.filter((item) => item.productSlug !== productSlug));
  }, []);

  const clearBasket = useCallback(() => setBasket([]), []);

  const setPalette = useCallback((palette: Palette) => {
    setPaletteState(palette);
    document.documentElement.dataset.palette = palette;
    localStorage.setItem(PALETTE_KEY, palette);
    persistPreference({ palette, mode: modeState, reducedMotion });
  }, [modeState, persistPreference, reducedMotion]);

  const setMode = useCallback((mode: DisplayMode) => {
    setModeState(mode);
    const effective = mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
    document.documentElement.dataset.mode = effective;
    localStorage.setItem(MODE_KEY, mode);
    persistPreference({ palette: paletteState, mode, reducedMotion });
  }, [paletteState, persistPreference, reducedMotion]);

  const setReducedMotion = useCallback((value: boolean) => {
    setReducedMotionState(value); document.documentElement.dataset.motion = value ? "reduced" : "full";
    localStorage.setItem(MOTION_KEY, value ? "reduced" : "full");
    persistPreference({ palette: paletteState, mode: modeState, reducedMotion: value });
  }, [modeState, paletteState, persistPreference]);

  const resetTheme = useCallback(() => {
    const preference: ThemePreference = { palette: "sky", mode: "system", reducedMotion: false };
    setPaletteState("sky"); setModeState("system"); setReducedMotionState(false);
    document.documentElement.dataset.palette = "sky";
    document.documentElement.dataset.mode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.motion = "full";
    localStorage.setItem(PALETTE_KEY, "sky"); localStorage.setItem(MODE_KEY, "system"); localStorage.setItem(MOTION_KEY, "full");
    persistPreference(preference);
  }, [persistPreference]);

  const value = useMemo(
    () => ({
      session,
      basket,
      basketCount: basket.reduce((total, item) => total + item.quantity, 0),
      basketActivity,
      addItem,
      updateItem,
      removeItem,
      clearBasket,
      palette: paletteState,
      mode: modeState,
      reducedMotion,
      setPalette,
      setMode,
      setReducedMotion,
      resetTheme,
    }),
    [
      addItem,
      basket,
      basketActivity,
      clearBasket,
      modeState,
      paletteState,
      removeItem,
      setPalette,
      setMode,
      setReducedMotion,
      resetTheme,
      session,
      reducedMotion,
      updateItem,
    ],
  );

  return <SiteContext.Provider value={value}>{children}<p className="sr-only" role="status" aria-live="polite" aria-atomic="true">{basketAnnouncement}</p></SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error("useSite must be used within SiteProvider");
  return context;
}
