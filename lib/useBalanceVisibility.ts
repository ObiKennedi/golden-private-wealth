"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "gpw_balance_visible";

/**
 * Global balance-visibility hook that persists to localStorage.
 * All components that call this hook share the same value because they
 * all read/write the same localStorage key and listen to a custom event
 * ("gpw:visibility-change") that fires whenever any component toggles.
 */
export function useBalanceVisibility() {
    // Safe initial state for SSR/hydration matching (default to hidden / false)
    const [visible, setVisible] = useState<boolean>(false);
    const [mounted, setMounted] = useState<boolean>(false);

    // Load from localStorage on mount to avoid hydration mismatch
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
            setVisible(stored === "true");
        } else {
            // Default to false (hidden) if not set
            setVisible(false);
        }
        setMounted(true);
    }, []);

    // Listen for changes made by other component instances / tabs
    useEffect(() => {
        const onCustom = (e: Event) => {
            setVisible((e as CustomEvent<boolean>).detail);
        };
        window.addEventListener("gpw:visibility-change", onCustom);
        return () => window.removeEventListener("gpw:visibility-change", onCustom);
    }, []);

    const toggle = useCallback(() => {
        setVisible(prev => {
            const next = !prev;
            localStorage.setItem(STORAGE_KEY, String(next));
            window.dispatchEvent(new CustomEvent("gpw:visibility-change", { detail: next }));
            return next;
        });
    }, []);

    return { visible, toggle };
}
