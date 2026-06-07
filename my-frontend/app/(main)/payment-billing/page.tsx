"use client";

import { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  Lock,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCcw,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { usePreferences } from "@/lib/i18n";
import PageHero from "@/components/layout/PageHero";

type TransactionStatus = "pending" | "paid" | "failed" | "refunded" | "expired";
type RefundStatus = "processing" | "completed" | "rejected";

interface Transaction {
  id: string;
  orderCode: string;
  method: string;
  amount: string;
  status: TransactionStatus;
  createdAt: string;
}

interface Refund {
  refundId: string;
  orderCode: string;
  returnRequestCode: string;
  amount: string;
  status: RefundStatus;
  createdAt: string;
}

interface PaymentMethodItem {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ComponentType<any>;
  isComingSoon: boolean;
  isRecommended: boolean;
  isDefault: boolean;
}

// Mock Data
const paymentHistory: Transaction[] = [
  {
    id: "TXN-001",
    orderCode: "#ORD-1001",
    method: "VietQR",
    amount: "2,199,000đ",
    status: "paid",
    createdAt: "2026-05-12",
  },
  {
    id: "TXN-002",
    orderCode: "#ORD-1002",
    method: "VietQR",
    amount: "1,550,000đ",
    status: "pending",
    createdAt: "2026-05-10",
  },
  {
    id: "TXN-003",
    orderCode: "#ORD-1003",
    method: "COD",
    amount: "450,000đ",
    status: "failed",
    createdAt: "2026-05-08",
  },
  {
    id: "TXN-004",
    orderCode: "#ORD-1004",
    method: "VietQR",
    amount: "2,199,000đ",
    status: "refunded",
    createdAt: "2026-05-05",
  },
  {
    id: "TXN-005",
    orderCode: "#ORD-1005",
    method: "VietQR",
    amount: "320,000đ",
    status: "expired",
    createdAt: "2026-05-02",
  },
];

const refundHistory: Refund[] = [
  {
    refundId: "#RF-1001",
    orderCode: "#ORD-1004",
    returnRequestCode: "#RR-1001",
    amount: "2,199,000đ",
    status: "completed",
    createdAt: "2026-05-20",
  },
  {
    refundId: "#RF-1002",
    orderCode: "#ORD-1006",
    returnRequestCode: "#RR-1002",
    amount: "1,200,000đ",
    status: "processing",
    createdAt: "2026-05-25",
  },
  {
    refundId: "#RF-1003",
    orderCode: "#ORD-1007",
    returnRequestCode: "#RR-1003",
    amount: "850,000đ",
    status: "rejected",
    createdAt: "2026-05-28",
  },
];

const transactionStatusStyles: Record<TransactionStatus, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-blue-50 text-blue-700 border-blue-200",
  expired: "bg-gray-50 text-gray-700 border-gray-200",
};

const refundStatusStyles: Record<RefundStatus, string> = {
  processing: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-green-50 text-green-700 border-green-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export default function PaymentBillingPage() {
  const { t } = usePreferences();
  const [transactions] = useState<Transaction[]>(paymentHistory);
  const [refunds] = useState<Refund[]>(refundHistory);

  const paymentMethods: PaymentMethodItem[] = [
    {
      id: "vietqr",
      nameKey: "payment.methods.vietqr",
      descKey: "payment.methods.vietqrDesc",
      icon: QrCode,
      isComingSoon: false,
      isRecommended: true,
      isDefault: true,
    },
    {
      id: "cod",
      nameKey: "payment.methods.cod",
      descKey: "payment.methods.codDesc",
      icon: Banknote,
      isComingSoon: false,
      isRecommended: false,
      isDefault: false,
    },
    {
      id: "visa",
      nameKey: "payment.methods.visa",
      descKey: "payment.methods.visaDesc",
      icon: CreditCard,
      isComingSoon: true,
      isRecommended: false,
      isDefault: false,
    },
    {
      id: "momo",
      nameKey: "payment.methods.momo",
      descKey: "payment.methods.momoDesc",
      icon: Smartphone,
      isComingSoon: true,
      isRecommended: false,
      isDefault: false,
    },
    {
      id: "vnpay",
      nameKey: "payment.methods.vnpay",
      descKey: "payment.methods.vnpayDesc",
      icon: CreditCard,
      isComingSoon: true,
      isRecommended: false,
      isDefault: false,
    },
  ];

  return (
    <div className="w-full bg-brand-bg min-h-screen">
      <PageHero
        variant="default"
        title={t("payment.heroTitle")}
        description={t("payment.heroSubtitle")}
        breadcrumbs={[{ label: t("payment.heroTitle") }]}
        centered={true}
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 space-y-8">
        {/* PAYMENT METHODS SECTION */}
        <section className="bg-brand-surface border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-brand-text tracking-tight">
              {t("payment.methods.title")}
            </h2>
            <p className="text-sm text-brand-muted mt-1">
              {t("payment.methods.subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mt-6">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <div
                  key={method.id}
                  className={`relative flex flex-col justify-between border rounded-2xl p-5 transition duration-300 ${
                    method.isComingSoon
                      ? "border-brand-border bg-brand-bg/70 opacity-60 cursor-not-allowed select-none"
                      : "border-brand-border bg-brand-surface hover:border-brand-primary hover:shadow-md cursor-default"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                          method.isComingSoon
                            ? "bg-gray-300 text-gray-500"
                            : "bg-brand-primary text-white"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>

                      {/* BADGES */}
                      <div className="flex flex-col items-end gap-1">
                        {method.isRecommended && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-border">
                            {t("payment.badge.recommended")}
                          </span>
                        )}
                        {method.isDefault && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-250">
                            {t("payment.badge.default")}
                          </span>
                        )}
                        {method.isComingSoon && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            {t("payment.badge.comingSoon")}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-brand-text mt-4">
                      {t(method.nameKey)}
                    </h3>
                    <p className="text-xs text-brand-muted mt-1.5 leading-relaxed">
                      {t(method.descKey)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* TWO COLUMN GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* COLUMN 1 & 2: TRANSACTIONS & REFUNDS */}
          <div className="md:col-span-1 lg:col-span-2 space-y-8">
            
            {/* RECENT TRANSACTIONS */}
            <section className="bg-brand-surface border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-brand-text tracking-tight">
                  {t("payment.history.title")}
                </h2>
              </div>

              {!transactions.length ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-brand-bg text-brand-muted rounded-full flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-brand-text">
                    {t("payment.history.empty.title")}
                  </h3>
                  <p className="text-sm text-brand-muted mt-1 max-w-sm">
                    {t("payment.history.empty.subtitle")}
                  </p>
                </div>
              ) : (
                /* TABLE LIST */
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-brand-muted border-b border-brand-border">
                      <tr>
                        <th className="pb-3 font-semibold">{t("payment.history.column.order")}</th>
                        <th className="pb-3 font-semibold">{t("payment.history.column.method")}</th>
                        <th className="pb-3 font-semibold">{t("payment.history.column.amount")}</th>
                        <th className="pb-3 font-semibold">{t("payment.history.column.status")}</th>
                        <th className="pb-3 font-semibold">{t("payment.history.column.date")}</th>
                        <th className="pb-3 font-semibold text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg">
                      {transactions.map((txn) => {
                        const orderId = txn.orderCode.replace("#ORD-", "");
                        return (
                          <tr key={txn.id} className="hover:bg-brand-bg/50 transition-colors">
                            <td className="py-4 font-semibold text-brand-text">
                              {txn.orderCode}
                            </td>
                            <td className="py-4 text-brand-muted font-medium">
                              {txn.method}
                            </td>
                            <td className="py-4 text-brand-text font-bold">
                              {txn.amount}
                            </td>
                            <td className="py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  transactionStatusStyles[txn.status]
                                }`}
                              >
                                {txn.status === "paid" && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {txn.status === "pending" && (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {txn.status === "failed" && (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {txn.status === "refunded" && (
                                  <RefreshCcw className="w-3.5 h-3.5" />
                                )}
                                {txn.status === "expired" && (
                                  <XCircle className="w-3.5 h-3.5 text-gray-400" />
                                )}
                                {t(`payment.status.${txn.status}`)}
                              </span>
                            </td>
                            <td className="py-4 text-brand-muted font-medium">{txn.createdAt}</td>
                            <td className="py-4 text-right">
                              <Link
                                href={`/orders/${orderId}`}
                                className="inline-flex items-center text-xs font-bold text-brand-primary hover:text-brand-primary-hover bg-brand-primary-light/40 hover:bg-brand-primary-light/60 px-3 py-1.5 rounded-full transition"
                              >
                                {t("action.viewOrder")}
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* REFUND HISTORY */}
            <section className="bg-brand-surface border border-brand-border rounded-3xl p-6 md:p-8 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-brand-text tracking-tight">
                    {t("payment.refund.title")}
                  </h2>
                  <p className="text-xs text-brand-muted mt-0.5">
                    {t("payment.refund.subtitle")}
                  </p>
                </div>
              </div>

              {!refunds.length ? (
                /* EMPTY STATE */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 bg-brand-bg text-brand-muted rounded-full flex items-center justify-center mb-3">
                    <RefreshCcw className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-brand-text">
                    {t("payment.refund.empty.title")}
                  </h3>
                  <p className="text-sm text-brand-muted mt-1 max-w-sm">
                    {t("payment.refund.empty.subtitle")}
                  </p>
                </div>
              ) : (
                /* TABLE LIST */
                <div className="mt-6 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="text-left text-brand-muted border-b border-brand-border">
                      <tr>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.refundId")}</th>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.order")}</th>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.returnRequest")}</th>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.amount")}</th>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.status")}</th>
                        <th className="pb-3 font-semibold">{t("payment.refund.column.date")}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-bg">
                      {refunds.map((ref) => {
                        const orderId = ref.orderCode.replace("#ORD-", "");
                        return (
                          <tr key={ref.refundId} className="hover:bg-brand-bg/50 transition-colors">
                            <td className="py-4 font-semibold text-brand-text">
                              {ref.refundId}
                            </td>
                            <td className="py-4">
                              <Link
                                href={`/orders/${orderId}`}
                                className="font-semibold text-brand-primary hover:text-brand-primary-hover transition"
                              >
                                {ref.orderCode}
                              </Link>
                            </td>
                            <td className="py-4 text-brand-muted font-medium">
                              {ref.returnRequestCode}
                            </td>
                            <td className="py-4 text-brand-text font-bold">
                              {ref.amount}
                            </td>
                            <td className="py-4">
                              <span
                                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                                  refundStatusStyles[ref.status]
                                }`}
                              >
                                {ref.status === "completed" && (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                {ref.status === "processing" && (
                                  <Clock className="w-3.5 h-3.5" />
                                )}
                                {ref.status === "rejected" && (
                                  <XCircle className="w-3.5 h-3.5" />
                                )}
                                {t(`payment.refund.status.${ref.status}`)}
                              </span>
                            </td>
                            <td className="py-4 text-brand-muted font-medium">{ref.createdAt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* COLUMN 3: SIDEBAR (LEGEND & SECURITY) */}
          <div className="md:col-span-1 lg:col-span-1 space-y-6">
            
            {/* TRANSACTION STATUS LEGEND */}
            <section className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-sm">
              <h2 className="text-lg font-bold text-brand-text tracking-tight mb-4">
                {t("payment.legend.title")}
              </h2>
              <div className="space-y-3.5">
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-text">{t("payment.status.pending")}</p>
                    <p className="text-xs text-brand-muted">{t("payment.legend.pending")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-text">{t("payment.status.paid")}</p>
                    <p className="text-xs text-brand-muted">{t("payment.legend.paid")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-text">{t("payment.status.refunded")}</p>
                    <p className="text-xs text-brand-muted">{t("payment.legend.refunded")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-text">{t("payment.status.failed")}</p>
                    <p className="text-xs text-brand-muted">{t("payment.legend.failed")}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-brand-text">{t("payment.status.expired")}</p>
                    <p className="text-xs text-brand-muted">{t("payment.legend.expired")}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECURITY INFORMATION */}
            <section className="bg-brand-surface border border-brand-border rounded-3xl p-6 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-bold text-brand-text tracking-tight">
                  {t("payment.security.title")}
                </h2>
                <p className="text-xs text-brand-muted mt-0.5">
                  {t("payment.security.subtitle")}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3.5 p-1 hover:bg-brand-bg/50 rounded-xl transition duration-200">
                  <ShieldCheck className="w-6 h-6 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-brand-text leading-none">
                      {t("payment.security.sslTitle")}
                    </p>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {t("payment.security.sslDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-1 hover:bg-brand-bg/50 rounded-xl transition duration-200">
                  <Lock className="w-6 h-6 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-brand-text leading-none">
                      {t("payment.security.encryptedTitle")}
                    </p>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {t("payment.security.encryptedDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-1 hover:bg-brand-bg/50 rounded-xl transition duration-200">
                  <CheckCircle2 className="w-6 h-6 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-brand-text leading-none">
                      {t("payment.security.pciTitle")}
                    </p>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {t("payment.security.pciDesc")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 p-1 hover:bg-brand-bg/50 rounded-xl transition duration-200">
                  <ShieldAlert className="w-6 h-6 text-brand-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm text-brand-text leading-none">
                      {t("payment.security.fraudTitle")}
                    </p>
                    <p className="text-xs text-brand-muted mt-1 leading-relaxed">
                      {t("payment.security.fraudDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>
      </div>
    </div>
  );
}
