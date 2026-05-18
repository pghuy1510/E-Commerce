"use client";

import { useState } from "react";
import {
  Banknote,
  CheckCircle2,
  CreditCard,
  Lock,
  ShieldCheck,
  Smartphone,
  Star,
  XCircle,
} from "lucide-react";
import { usePreferences } from "@/lib/i18n";

const paymentHistory = [
  {
    id: "PAY-1201",
    order: "#ORD-1001",
    method: "VISA",
    amount: "$180.00",
    status: "paid",
    date: "2026-05-12",
  },
  {
    id: "PAY-1202",
    order: "#ORD-1002",
    method: "COD",
    amount: "$2,199.00",
    status: "pending",
    date: "2026-05-10",
  },
  {
    id: "PAY-1203",
    order: "#ORD-1003",
    method: "MOMO",
    amount: "$240.00",
    status: "failed",
    date: "2026-05-08",
  },
  {
    id: "PAY-1204",
    order: "#ORD-1004",
    method: "VNPAY",
    amount: "$90.00",
    status: "refunded",
    date: "2026-05-05",
  },
];

const statusStyles: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  paid: "bg-green-100 text-green-700 border-green-200",
  failed: "bg-red-100 text-red-700 border-red-200",
  refunded: "bg-blue-100 text-blue-700 border-blue-200",
};

const bankAccounts = [
  {
    id: "bank-1",
    bankName: "Vietcombank",
    accountNumber: "**** 3812",
    holder: "Nguyen Van A",
  },
  {
    id: "bank-2",
    bankName: "Techcombank",
    accountNumber: "**** 1198",
    holder: "Nguyen Van A",
  },
  {
    id: "bank-3",
    bankName: "ACB",
    accountNumber: "**** 5520",
    holder: "Nguyen Van A",
  },
];

export default function SecurePaymentPage() {
  const { t } = usePreferences();
  const [defaultBankId, setDefaultBankId] = useState("bank-1");
  const paymentMethods = [
    {
      id: "visa",
      name: t("payment.methods.visa"),
      desc: t("payment.methods.visaDesc"),
      icon: CreditCard,
    },
    {
      id: "cod",
      name: t("payment.methods.cod"),
      desc: t("payment.methods.codDesc"),
      icon: Banknote,
    },
    {
      id: "momo",
      name: t("payment.methods.momo"),
      desc: t("payment.methods.momoDesc"),
      icon: Smartphone,
    },
    {
      id: "vnpay",
      name: t("payment.methods.vnpay"),
      desc: t("payment.methods.vnpayDesc"),
      icon: CreditCard,
    },
  ];
  const statusLabels: Record<string, string> = {
    pending: t("payment.status.pending"),
    paid: t("payment.status.paid"),
    failed: t("payment.status.failed"),
    refunded: t("payment.status.refunded"),
  };

  return (
    <div className="w-full bg-gray-50">
      {/* HERO */}
      <div className="bg-gradient-to-r from-yellow-600 to-white py-16 text-center">
        <div className="flex items-center justify-center gap-3 text-white mb-3">
          <ShieldCheck className="w-7 h-7" />
          <span className="text-sm uppercase tracking-widest">
            {t("payment.heroTag")}
          </span>
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          {t("payment.heroTitle")}
        </h1>
        <p className="text-gray-700 mt-3 max-w-2xl mx-auto">
          {t("payment.heroSubtitle")}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-14 space-y-12">
        {/* PAYMENT METHODS */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t("payment.methods.title")}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  {t("payment.methods.subtitle")}
                </p>
              </div>
              <button className="px-5 py-2 rounded-full bg-yellow-600 text-white font-semibold hover:bg-yellow-700 transition">
                {t("payment.methods.addButton")}
              </button>
            </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mt-8">
            {paymentMethods.map((method) => {
              const Icon = method.icon;

              return (
                <div
                  key={method.id}
                  className="border border-gray-200 rounded-2xl p-5 hover:border-yellow-600 transition">
                  <div className="w-11 h-11 rounded-2xl bg-yellow-600 text-white flex items-center justify-center shadow-sm">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mt-4">
                    {method.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-2">{method.desc}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <span className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50">
              {t("payment.methods.chip.visa")}
            </span>
            <span className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50">
              {t("payment.methods.chip.cod")}
            </span>
            <span className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50">
              {t("payment.methods.chip.momo")}
            </span>
            <span className="px-4 py-2 rounded-full border border-gray-200 bg-gray-50">
              {t("payment.methods.chip.vnpay")}
            </span>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SAVED BANKS */}
          <section className="lg:col-span-2 bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t("payment.banks.title")}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  {t("payment.banks.subtitle")}
                </p>
              </div>
              <button className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-yellow-600 hover:text-yellow-600 transition">
                {t("payment.banks.addButton")}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {bankAccounts.map((bank) => {
                const isDefault = bank.id === defaultBankId;

                return (
                  <div
                    key={bank.id}
                    className="border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-gray-900">
                        {bank.bankName}
                      </p>
                      <p className="text-sm text-gray-600">
                        {bank.accountNumber} · {bank.holder}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setDefaultBankId(bank.id)}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold border transition ${
                          isDefault
                            ? "border-yellow-600 bg-yellow-50 text-yellow-700"
                            : "border-gray-300 text-gray-600 hover:border-yellow-600 hover:text-yellow-600"
                        }`}>
                        <Star className="w-4 h-4" />
                        {isDefault
                          ? t("payment.banks.default")
                          : t("payment.banks.setDefault")}
                      </button>

                      <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-yellow-600 hover:text-yellow-600 transition">
                        {t("payment.banks.edit")}
                      </button>

                      <button className="rounded-full border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600 hover:border-red-400 hover:text-red-600 transition">
                        {t("payment.banks.delete")}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECURITY */}
          <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm space-y-5">
            <h2 className="text-2xl font-semibold text-gray-900">
              {t("payment.security.title")}
            </h2>
            <p className="text-sm text-gray-600">
              {t("payment.security.subtitle")}
            </p>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("payment.security.sslTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("payment.security.sslDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("payment.security.encryptedTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("payment.security.encryptedDesc")}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-yellow-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">
                    {t("payment.security.pciTitle")}
                  </p>
                  <p className="text-sm text-gray-600">
                    {t("payment.security.pciDesc")}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* PAYMENT HISTORY */}
        <section className="bg-white border border-gray-200 rounded-3xl p-8 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
                <h2 className="text-2xl font-semibold text-gray-900">
                  {t("payment.history.title")}
                </h2>
                <p className="text-sm text-gray-600 mt-2">
                  {t("payment.history.subtitle")}
                </p>
              </div>
              <button className="px-5 py-2 rounded-full border border-gray-300 text-gray-700 font-semibold hover:border-yellow-600 hover:text-yellow-600 transition">
                {t("payment.history.downloadButton")}
              </button>
            </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="pb-3">{t("payment.history.column.order")}</th>
                  <th className="pb-3">{t("payment.history.column.method")}</th>
                  <th className="pb-3">{t("payment.history.column.amount")}</th>
                  <th className="pb-3">{t("payment.history.column.status")}</th>
                  <th className="pb-3">{t("payment.history.column.date")}</th>
                </tr>
              </thead>
              <tbody>
                {paymentHistory.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">
                      {payment.order}
                    </td>
                    <td className="py-4 text-gray-600">{payment.method}</td>
                    <td className="py-4 text-gray-900">{payment.amount}</td>
                    <td className="py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusStyles[payment.status]
                        }`}>
                        {payment.status === "paid" && (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        {payment.status === "pending" && (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {payment.status === "failed" && (
                          <XCircle className="w-3 h-3" />
                        )}
                        {payment.status === "refunded" && (
                          <ShieldCheck className="w-3 h-3" />
                        )}
                        {statusLabels[payment.status] ?? payment.status}
                      </span>
                    </td>
                    <td className="py-4 text-gray-600">{payment.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
