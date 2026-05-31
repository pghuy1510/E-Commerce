"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, ImageUp, AlertCircle, CheckCircle } from "lucide-react";
import { orderAPI } from "@/lib/api";

const REASONS = [
  "Sản phẩm bị lỗi kỹ thuật / không hoạt động",
  "Sản phẩm bị bể vỡ / móp méo khi vận chuyển",
  "Gửi sai sản phẩm / thiếu phụ kiện",
  "Sản phẩm không đúng mô tả trên website",
  "Tôi không còn nhu cầu sử dụng (Sản phẩm chưa mở seal)",
];

export default function OrderReturnPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params.id);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [reason, setReason] = useState(REASONS[0]);
  const [note, setNote] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        setLoading(true);
        const data = await orderAPI.getById(orderId);
        setOrder(data);

        // Verify status
        if (data.status !== "delivered") {
          setError("Chỉ đơn hàng đã giao thành công mới có thể yêu cầu trả hàng.");
        } else {
          // Check 7 days limit
          const deliveredAt = data.deliveredAt;
          if (deliveredAt) {
            const diffTime = Math.abs(new Date().getTime() - new Date(deliveredAt).getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays > 7) {
              setError("Đơn hàng đã giao thành công quá 7 ngày, quá thời hạn yêu cầu đổi trả.");
            }
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải thông tin đơn hàng.");
      } finally {
        setLoading(false);
      }
    }
    if (orderId) {
      loadOrder();
    }
  }, [orderId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Kích thước ảnh không được vượt quá 5MB.");
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!allowedMimeTypes.includes(file.type)) {
      alert("Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP.");
      return;
    }

    setImageFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      alert("Vui lòng chọn lý do trả hàng.");
      return;
    }

    try {
      setSubmitting(true);
      await orderAPI.requestReturn(orderId, {
        reason: `${reason}${note ? ` - Chi tiết: ${note}` : ""}`,
        imageProof: imagePreview || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push(`/orders/${orderId}`);
      }, 2000);
    } catch (err: any) {
      alert(err.response?.data?.message || "Yêu cầu trả hàng thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-600 mx-auto" />
          <p className="text-gray-500 text-sm">Đang tải thông tin đơn hàng...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Không thể yêu cầu trả hàng</h2>
          <p className="text-sm text-gray-600">{error}</p>
          <Link
            href={`/orders/${orderId}`}
            className="block w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-full py-2.5 font-semibold text-sm transition"
          >
            Quay lại chi tiết đơn hàng
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border border-gray-200 shadow-sm text-center space-y-4">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Gửi yêu cầu thành công</h2>
          <p className="text-sm text-gray-600">
            Yêu cầu đổi trả đã được gửi tới hệ thống. Bạn đang được chuyển hướng quay lại trang chi tiết đơn hàng...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* BACK ACTION */}
        <Link href={`/orders/${orderId}`} className="flex items-center gap-2 text-gray-600 hover:text-yellow-600 transition font-medium">
          <ArrowLeft size={18} /> Quay lại đơn hàng
        </Link>

        <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Yêu cầu đổi trả sản phẩm</h1>
            <p className="text-sm text-gray-500 mt-1">Đơn hàng #ORD-{orderId}</p>
          </div>

          {/* ITEM SUMMARY */}
          <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-3">
            <h3 className="text-xs font-semibold uppercase text-gray-400">Danh sách sản phẩm đổi trả</h3>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item: any) => (
                <div key={item.id} className="py-2.5 flex justify-between text-sm">
                  <span className="text-gray-800 font-medium">{item.productName}</span>
                  <span className="text-gray-500">x{item.quantity}</span>
                </div>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* REASON */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Lý do đổi trả</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600 bg-white text-sm"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* DETAIL NOTES */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Mô tả chi tiết lỗi / lý do</label>
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Vui lòng cung cấp thêm thông tin chi tiết về tình trạng sản phẩm để admin xử lý nhanh chóng hơn..."
                className="w-full border border-gray-300 rounded-xl px-4 py-3 outline-none focus:border-yellow-600 text-sm"
              />
            </div>

            {/* IMAGE PROOF */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700">Ảnh minh chứng sản phẩm lỗi (Tối đa 5MB)</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-2xl p-6 cursor-pointer hover:border-yellow-600 transition">
                  <ImageUp className="w-8 h-8 text-yellow-600 mb-2" />
                  <span className="text-xs text-gray-600 font-medium text-center">
                    {imageFile ? imageFile.name : "Nhấp để chọn ảnh chụp"}
                  </span>
                  <span className="text-[10px] text-gray-400 mt-1">Chấp nhận JPG, PNG, WEBP</span>
                  <input type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                </label>

                {imagePreview && (
                  <div className="relative border border-gray-200 rounded-2xl overflow-hidden flex items-center justify-center bg-gray-50 p-2">
                    <img src={imagePreview} alt="Proof preview" className="max-h-32 object-contain rounded-lg" />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-yellow-600 hover:bg-yellow-700 text-white rounded-full py-3.5 font-bold transition flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Đang gửi yêu cầu...
                </>
              ) : (
                "Gửi yêu cầu trả hàng"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
