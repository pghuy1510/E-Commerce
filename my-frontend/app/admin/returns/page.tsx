"use client";

import { useEffect, useState } from "react";
import {
  Check,
  X,
  Loader2,
  AlertTriangle,
  FileImage,
  MessageSquare
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const { formatPrice } = usePreferences();

  useEffect(() => {
    fetchReturnRequests();
  }, []);

  const fetchReturnRequests = async () => {
    try {
      setLoading(true);
      const data = await adminAPI.getReturns();
      setReturns(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const actionText = action === "approve" ? "chấp nhận hoàn tiền" : "từ chối yêu cầu đổi trả";
    const note = prompt(`Nhập ghi chú phản hồi cho khách hàng (Tùy chọn):`);
    if (note === null) return; // user cancelled prompt

    try {
      setSubmittingId(id);
      await adminAPI.handleReturn(id, {
        action,
        note: note.trim() || undefined,
      });
      alert(`Đã ${actionText} thành công!`);
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể thực hiện thao tác lúc này.");
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* RETURN LIST CARD */}
      <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : returns.length === 0 ? (
          <div className="text-center py-24 text-gray-400 font-medium">
            Chưa có yêu cầu đổi trả / hoàn tiền nào.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-gray-500 font-bold uppercase text-[10px] tracking-wider">
                  <th className="px-6 py-4">Mã yêu cầu</th>
                  <th className="px-6 py-4">Đơn hàng</th>
                  <th className="px-6 py-4">Khách hàng</th>
                  <th className="px-6 py-4">Lý do đổi trả</th>
                  <th className="px-6 py-4">Minh chứng</th>
                  <th className="px-6 py-4 text-right">Hoàn tiền dự kiến</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-gray-50/30 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">#RET-{ret.id}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">#ORD-{ret.order?.id}</td>
                    <td className="px-6 py-4 font-semibold text-gray-800">
                      {ret.order?.user?.fullName || ret.order?.user?.username || "Guest"}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-xs leading-relaxed max-w-xs">
                      {ret.reason}
                    </td>
                    <td className="px-6 py-4">
                      {ret.imageProof ? (
                        <a
                          href={ret.imageProof}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-600 font-semibold hover:underline"
                        >
                          <FileImage size={14} /> Xem ảnh
                        </a>
                      ) : (
                        <span className="text-xs text-gray-400">Không có ảnh</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-amber-600">
                      {formatPrice(ret.refundAmount || ret.order?.totalAmount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        ret.status === "approved" ? "bg-green-50 text-green-700 border border-green-100" :
                        ret.status === "rejected" ? "bg-red-50 text-red-700 border border-red-100" :
                        "bg-yellow-50 text-yellow-700 border border-yellow-100"
                      }`}>
                        {ret.status === "pending" ? "Chờ duyệt" : ret.status === "approved" ? "Đã duyệt" : "Từ chối"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {ret.status === "pending" ? (
                        <div className="flex justify-center gap-1.5">
                          <button
                            disabled={submittingId !== null}
                            onClick={() => handleAction(ret.id, "approve")}
                            className="p-2 bg-green-50 hover:bg-green-600 hover:text-white border border-green-150 text-green-600 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                            title="Duyệt hoàn tiền"
                          >
                            {submittingId === ret.id ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                          </button>
                          <button
                            disabled={submittingId !== null}
                            onClick={() => handleAction(ret.id, "reject")}
                            className="p-2 bg-red-50 hover:bg-red-600 hover:text-white border border-red-150 text-red-600 rounded-xl transition flex items-center justify-center disabled:opacity-50"
                            title="Từ chối yêu cầu"
                          >
                            {submittingId === ret.id ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 font-medium">Đã xử lý</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
