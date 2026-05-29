"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { XCircle } from "lucide-react";

function OrderFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <div className="min-h-screen bg-[#fbf8f3] flex items-center justify-center px-6">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg border border-rose-100 p-8 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center">
          <XCircle className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">Payment failed</h1>
        <p className="text-sm text-gray-600 mt-2">
          Your payment could not be verified. Please try again.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mt-4">
            Order ID: <span className="font-semibold">#{orderId}</span>
          </p>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 hover:bg-rose-50 transition">
            Retry checkout
          </Link>
          <Link
            href="/"
            className="rounded-2xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-600 transition">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderFailedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbf8f3] flex items-center justify-center px-6">
          <div className="max-w-xl w-full bg-white rounded-3xl shadow-lg border border-rose-100 p-8 text-center">
            <p className="text-sm text-gray-600">Loading order...</p>
          </div>
        </div>
      }>
      <OrderFailedContent />
    </Suspense>
  );
}
