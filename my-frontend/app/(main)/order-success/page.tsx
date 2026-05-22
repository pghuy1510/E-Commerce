"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#fbf8f3] flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg border border-amber-100 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-emerald-50 flex items-center justify-center">
          <CheckCircle2 className="h-7 w-7 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Payment successful
        </h1>
        <p className="text-sm text-gray-600 mt-2">
          Your order is confirmed and being prepared.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mt-4">
            Order ID: <span className="font-semibold">#{orderId}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/orders"
            className="rounded-2xl border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700 hover:bg-amber-50 transition">
            View orders
          </Link>
          <Link
            href="/"
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition">
            Continue shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
