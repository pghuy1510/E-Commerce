"use client";

import { useState } from "react";
import { Star, X, Loader2, Camera } from "lucide-react";
import { reviewsAPI } from "@/lib/api";

interface LeaveReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: number;
  productName: string;
  orderId: number;
  onSuccess: () => void;
}

export default function LeaveReviewModal({
  isOpen,
  onClose,
  productId,
  productName,
  orderId,
  onSuccess,
}: LeaveReviewModalProps) {
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddImageUrl = () => {
    if (imageUrlInput.trim()) {
      setImages((prev) => [...prev, imageUrlInput.trim()]);
      setImageUrlInput("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) {
      setError("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await reviewsAPI.create({
        productId,
        orderId,
        rating,
        comment: comment.trim(),
        images: images.length > 0 ? images : undefined,
      });
      alert("Đánh giá của bạn đã được gửi thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Không thể gửi đánh giá lúc này.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-lg overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-amber-50/50">
          <div>
            <h3 className="font-bold text-gray-950">Viết Đánh Giá</h3>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl">
              {error}
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2 text-center">
            <label className="text-sm font-semibold text-gray-700 block">
              Mức độ hài lòng của bạn?
            </label>
            <div className="flex justify-center gap-1.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="p-1 transition-transform active:scale-95"
                >
                  <Star
                    size={32}
                    className={`transition-colors ${
                      star <= (hoverRating ?? rating)
                        ? "text-amber-500 fill-amber-500"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-amber-600 block">
              {rating === 1 && "Rất tệ"}
              {rating === 2 && "Tệ"}
              {rating === 3 && "Bình thường"}
              {rating === 4 && "Tốt"}
              {rating === 5 && "Rất tốt"}
            </span>
          </div>

          {/* Comment */}
          <div className="space-y-1.5">
            <label htmlFor="comment" className="text-sm font-semibold text-gray-700">
              Nội dung đánh giá
            </label>
            <textarea
              id="comment"
              rows={4}
              required
              placeholder="Chia sẻ trải nghiệm của bạn về sản phẩm này nhé (chất lượng, đóng gói, giao hàng...)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-2xl border border-gray-200 p-3.5 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition resize-none placeholder:text-gray-400"
            />
          </div>

          {/* Images List & Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
              <Camera size={16} /> Link hình ảnh minh chứng (Tùy chọn)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Dán link ảnh từ Unsplash, Imgur..."
                value={imageUrlInput}
                onChange={(e) => setImageUrlInput(e.target.value)}
                className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs outline-none focus:border-amber-500 transition"
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                className="bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs px-4 py-2 rounded-xl transition"
              >
                Thêm
              </button>
            </div>

            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {images.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl border overflow-hidden group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="review upload" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white p-0.5 rounded-full hover:bg-red-500 transition"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-semibold transition flex items-center gap-1.5"
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              Gửi Đánh Giá
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
