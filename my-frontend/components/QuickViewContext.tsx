"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { productAPI, type Product } from "@/lib/api";
import QuickViewModal from "./QuickViewModal";

// Memory cache for product detail fetches (5-minute TTL)
const productCache = new Map<number, { data: Product; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

type QuickViewContextType = {
  openQuickView: (productId: number) => void;
  prefetchProduct: (productId: number) => Promise<void>;
  getProductDetails: (productId: number) => Promise<Product>;
};

const QuickViewContext = createContext<QuickViewContextType | undefined>(undefined);

export function QuickViewProvider({ children }: { children: React.ReactNode }) {
  const [activeProductId, setActiveProductId] = useState<number | null>(null);

  const openQuickView = useCallback((productId: number) => {
    setActiveProductId(productId);
  }, []);

  const closeQuickView = useCallback(() => {
    setActiveProductId(null);
  }, []);

  const prefetchProduct = useCallback(async (id: number) => {
    const cached = productCache.get(id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return;
    }
    try {
      const data = await productAPI.getById(id);
      productCache.set(id, { data, timestamp: Date.now() });
    } catch (err) {
      console.error(`Prefetch failed for product ${id}:`, err);
    }
  }, []);

  const getProductDetails = useCallback(async (id: number): Promise<Product> => {
    const cached = productCache.get(id);
    const now = Date.now();
    if (cached && now - cached.timestamp < CACHE_TTL) {
      return cached.data;
    }
    const data = await productAPI.getById(id);
    productCache.set(id, { data, timestamp: Date.now() });
    return data;
  }, []);

  return (
    <QuickViewContext.Provider value={{ openQuickView, prefetchProduct, getProductDetails }}>
      {children}
      {activeProductId !== null && (
        <QuickViewModal productId={activeProductId} onClose={closeQuickView} />
      )}
    </QuickViewContext.Provider>
  );
}

export function useQuickView() {
  const context = useContext(QuickViewContext);
  if (!context) {
    throw new Error("useQuickView must be used within a QuickViewProvider");
  }
  return context;
}
