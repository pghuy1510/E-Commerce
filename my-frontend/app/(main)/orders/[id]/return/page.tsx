"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Image as ImageIcon, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { orderAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

const reasons = [
  "Sách bị rách, nát hoặc ướt",
  "Nội dung sách in sai/thiếu trang",
  "Sách giao sai tựa đề hoặc sai số lượng",
  "Không giống với mô tả hình ảnh trên web",
  "Không còn nhu cầu mua nữa (Đổi ý)",
];

export default function OrderReturnPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [imageLink, setImageLink] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const { t, formatPrice } = usePreferences();

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await orderAPI.getById(orderId);
      setOrder(data);
      if (data.status !== "delivered") {
        setMessage({
          text: "Chỉ đơn hàng đã giao thành công mới có thể yêu cầu trả hàng.",
          type: "error",
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ text: "Lỗi tải thông tin đơn hàng.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setMessage({ text: "Vui lòng chọn lý do trả hàng.", type: "error" });
      return;
    }

    const finalReason = reason === "Khác" ? customReason : reason;
    if (!finalReason.trim()) {
      setMessage({ text: "Vui lòng nhập lý do cụ thể.", type: "error" });
      return;
    }

    try {
      setSubmitting(true);
      setMessage(null);
      await orderAPI.requestReturn(orderId, {
        reason: finalReason,
        imageProof: imageLink || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=800", // Fallback mock image proof
      });

      setMessage({
        text: "Gửi yêu cầu trả hàng thành công! Đang chuyển hướng về chi tiết đơn hàng...",
        type: "success",
      });
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err?.response?.data?.message || "Không thể gửi yêu cầu trả hàng lúc này.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
          <p className="text-gray-500 font-medium">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#efefef] py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
        
        {/* HEADER */}
        <div className="flex items-center gap-3">
          <Link href={`/orders/${orderId}`} className="text-gray-400 hover:text-yellow-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yêu cầu Trả hàng / Hoàn tiền</h1>
            <p className="text-sm text-gray-500 mt-1">Đơn hàng #ORD-{orderId}</p>
          </div>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-sm flex gap-2.5 items-start border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? <CheckCircle size={18} className="shrink-0 mt-0.5" /> : <ShieldAlert size={18} className="shrink-0 mt-0.5" />}
            <span>{message.text}</span>
          </div>
        )}

        {order && order.status === "delivered" && (
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* REASON SELECT */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Lý do hoàn trả *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 bg-white text-sm"
                required
              >
                <option value="">-- Chọn lý do --</option>
                {reasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
                <option value="Khác">Lý do khác...</option>
              </select>
            </div>

            {/* CUSTOM REASON TEXTAREA */}
            {reason === "Khác" && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">Mô tả lý do chi tiết *</label>
                <textarea
                  rows={4}
                  placeholder="Vui lòng cung cấp thêm chi tiết về vấn đề sản phẩm..."
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="w-full p-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 text-sm"
                  required
                />
              </div>
            )}

            {/* IMAGE PROOF URL */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Ảnh minh chứng (Link ảnh hoặc URL) - Không bắt buộc</label>
              <div className="relative">
                <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={imageLink}
                  onChange={(e) => setImageLink(e.target.value)}
                  className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-300 outline-none focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-600 text-sm"
                />
              </div>
              <p className="text-[10px] text-gray-400 italic">Gợi ý: Bạn có thể copy bất kỳ link hình ảnh sản phẩm lỗi nào để làm ảnh minh chứng.</p>
            </div>

            {/* REFUND SUMMARY */}
            <div className="p-5 bg-yellow-50/50 border border-yellow-100 rounded-3xl space-y-2">
              <span className="text-xs font-semibold text-yellow-800 uppercase tracking-wider block">Ước tính số tiền hoàn trả</span>
              <p className="text-3xl font-extrabold text-yellow-600">{formatPrice(order.totalAmount)}</p>
              <span className="text-[10px] text-gray-400 block">Dự kiến hoàn trả đầy đủ bao gồm giá trị đơn hàng thực thanh toán.</span>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 h-12 bg-yellow-500 text-white rounded-2xl font-bold hover:bg-yellow-600 transition shadow-md disabled:opacity-50 text-sm"
              >
                {submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu hoàn tiền"}
              </button>
              
              <button
                type="button"
                onClick={() => router.push(`/orders/${orderId}`)}
                className="px-6 h-12 border rounded-2xl font-semibold hover:bg-gray-50 transition text-sm bg-white text-gray-700"
              >
                Hủy bỏ
              </button>
            </div>
            
          </form>
        )}
      </div>
    </div>
  );
}
