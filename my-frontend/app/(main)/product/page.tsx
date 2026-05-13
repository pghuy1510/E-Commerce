"use client";

import { usePreferences } from "@/lib/i18n";

export default function ProductPage() {
  const { t } = usePreferences();
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">{t("label.product")}</h1>
      <p className="mt-2 text-sm text-gray-600">
        {t("productPage.comingSoon")}
      </p>
    </main>
  );
}
