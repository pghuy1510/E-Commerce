"use client";

import { useEffect, useState, Fragment } from "react";
import {
  Check,
  X,
  Loader2,
  AlertTriangle,
  FileImage,
  MessageSquare,
  Package,
  Truck,
  ArrowRight,
  DollarSign,
  ShieldCheck,
  History,
  Info,
  ChevronDown
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Complete refund state
  const [completeRefundId, setCompleteRefundId] = useState<number | null>(null);
  const [refundMethod, setRefundMethod] = useState("");
  const [refundTxnId, setRefundTxnId] = useState("");
  
  const [expandedReturnId, setExpandedReturnId] = useState<number | null>(null);

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

  const getProofUrl = (path?: string) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    const baseUrl = process.env.NEXT_PUBLIC_API_URL 
      ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "") 
      : "http://localhost:3001";
    return baseUrl + path;
  };

  const handleAction = async (id: number, action: "approve" | "reject") => {
    const actionText = action === "approve" ? "chấp nhận yêu cầu trả hàng" : "từ chối yêu cầu đổi trả";
    const note = prompt(`Nhập lý do/ghi chú phản hồi cho khách hàng (Tùy chọn):`);
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

  const handleMarkReceived = async (id: number) => {
    if (!confirm("Xác nhận đã nhận được sản phẩm hoàn trả từ khách hàng tại kho?")) return;
    try {
      setSubmittingId(id);
      await adminAPI.markReturnReceived(id);
      alert("Đã cập nhật trạng thái nhận sản phẩm thành công!");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể thực hiện thao tác lúc này.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleStartRefund = async (id: number) => {
    if (!confirm("Bắt đầu thực hiện quy trình hoàn tiền cho khách hàng?")) return;
    try {
      setSubmittingId(id);
      await adminAPI.startReturnRefund(id);
      alert("Đã chuyển trạng thái sang Đang xử lý hoàn tiền!");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể thực hiện thao tác lúc này.");
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCompleteRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeRefundId) return;
    if (!refundMethod.trim() || !refundTxnId.trim()) {
      alert("Vui lòng nhập đầy đủ thông tin giao dịch hoàn tiền!");
      return;
    }
    try {
      setSubmittingId(completeRefundId);
      await adminAPI.completeReturnRefund(completeRefundId, {
        refundMethod: refundMethod.trim(),
        refundTransactionId: refundTxnId.trim(),
      });
      alert("Yêu cầu trả hàng đã hoàn tất hoàn tiền thành công!");
      setCompleteRefundId(null);
      setRefundMethod("");
      setRefundTxnId("");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || "Không thể thực hiện thao tác lúc này.");
    } finally {
      setSubmittingId(null);
    }
  };

  // Metric calculation
  const totalCount = returns.length;
  const pendingCount = returns.filter((r) => r.status === "return_requested").length;
  const processingCount = returns.filter((r) => ["return_approved", "product_received", "refund_processing"].includes(r.status)).length;
  const completedCount = returns.filter((r) => r.status === "refunded").length;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đổi trả & Hoàn tiền</h1>
          <p className="text-sm text-gray-500 mt-1">Xử lý yêu cầu trả hàng, nhận kho và đối soát hoàn tiền theo chu trình</p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-500">
            <History size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Tổng số yêu cầu</span>
            <span className="text-2xl font-black text-gray-900">{totalCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary">
            <Info size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider">Chờ xét duyệt</span>
            <span className="text-2xl font-black text-brand-primary">{pendingCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider font-bold">Đang xử lý</span>
            <span className="text-2xl font-black text-blue-600">{processingCount}</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs text-gray-400 block font-bold uppercase tracking-wider font-bold">Đã hoàn tiền</span>
            <span className="text-2xl font-black text-green-600">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* RETURN LIST CARD */}
      <div className="bg-white border border-gray-150 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
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
                  <th className="px-6 py-4">Lý do & Minh chứng</th>
                  <th className="px-6 py-4 text-right">Hoàn tiền dự kiến</th>
                  <th className="px-6 py-4 text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {returns.map((ret) => (
                  <Fragment key={ret.id}>
                    <tr className="hover:bg-gray-50/30 transition">
                      <td className="px-6 py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-1.5 font-bold text-gray-900">
                          <button
                            type="button"
                            onClick={() => setExpandedReturnId(expandedReturnId === ret.id ? null : ret.id)}
                            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-brand-primary transition"
                            title="Xem chi tiết & Lịch sử hành trình"
                          >
                            <ChevronDown size={14} className={`transform transition-transform ${expandedReturnId === ret.id ? "rotate-180 text-brand-primary" : ""}`} />
                          </button>
                          <span>#RET-{ret.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-700">#ORD-{ret.order?.id}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">
                          {ret.order?.user?.fullName || ret.order?.user?.username || "Guest"}
                        </div>
                        <span className="text-[10px] text-gray-400 block font-mono">{ret.order?.user?.email}</span>
                      </td>
                      <td className="px-6 py-4 max-w-xs space-y-1.5">
                        <p className="text-gray-600 text-xs leading-relaxed font-medium">
                          {ret.reason}
                        </p>
                        <div className="flex gap-2">
                          {ret.imageProof ? (
                            <a
                              href={getProofUrl(ret.imageProof)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded font-bold hover:bg-blue-100 transition"
                            >
                              <FileImage size={10} /> Xem ảnh proof
                            </a>
                          ) : (
                            <span className="text-[10px] text-gray-400 bg-gray-50 border px-2 py-0.5 rounded">Không minh chứng</span>
                          )}
                          {ret.rejectionReason && (
                            <span className="text-[10px] text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded font-medium block">
                              Từ chối: {ret.rejectionReason}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-brand-primary text-sm">
                        {formatPrice(ret.refundAmount || ret.order?.totalAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                          ret.status === "return_requested" ? "bg-brand-primary/10 text-brand-primary border-brand-border" :
                          ret.status === "return_approved" ? "bg-blue-50 text-blue-700 border-blue-100" :
                          ret.status === "product_received" ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                          ret.status === "refund_processing" ? "bg-purple-50 text-purple-700 border-purple-100" :
                          ret.status === "refunded" ? "bg-green-50 text-green-700 border-green-100" :
                          ret.status === "return_rejected" ? "bg-red-50 text-red-700 border-red-100" :
                          "bg-gray-50 text-gray-500 border-gray-100"
                        }`}>
                          {ret.status === "return_requested" && "Chờ duyệt"}
                          {ret.status === "return_approved" && "Đã duyệt / Chờ nhận hàng"}
                          {ret.status === "product_received" && "Đã nhận sản phẩm"}
                          {ret.status === "refund_processing" && "Đang hoàn tiền"}
                          {ret.status === "refunded" && "Đã hoàn tiền"}
                          {ret.status === "return_rejected" && "Từ chối trả hàng"}
                          {ret.status === "return_cancelled" && "Đã hủy"}
                          {ret.status}
                        </span>

                        {/* Display transaction details if completed */}
                        {ret.status === "refunded" && ret.refundMethod && (
                          <div className="mt-1.5 text-[9px] text-gray-400 text-left font-mono max-w-[150px] mx-auto bg-gray-50 p-1 rounded border">
                            <p>Mthd: {ret.refundMethod}</p>
                            <p className="truncate">TxID: {ret.refundTransactionId}</p>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1.5">
                          {ret.status === "return_requested" && (
                            <>
                              <button
                                disabled={submittingId !== null}
                                onClick={() => handleAction(ret.id, "approve")}
                                className="px-2.5 py-1.5 bg-green-50 hover:bg-green-600 hover:text-white border border-green-150 text-green-600 text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                                title="Duyệt trả hàng"
                              >
                                {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                Duyệt
                              </button>
                              <button
                                disabled={submittingId !== null}
                                onClick={() => handleAction(ret.id, "reject")}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white border border-red-150 text-red-600 text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                                title="Từ chối yêu cầu"
                              >
                                {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                Từ chối
                              </button>
                            </>
                          )}

                          {ret.status === "return_approved" && (
                            <button
                              disabled={submittingId !== null}
                              onClick={() => handleMarkReceived(ret.id)}
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 hover:text-white border border-blue-150 text-blue-600 text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                            >
                              {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
                              Đã nhận hàng kho
                            </button>
                          )}

                          {ret.status === "product_received" && (
                            <button
                              disabled={submittingId !== null}
                              onClick={() => handleStartRefund(ret.id)}
                              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 hover:text-white border border-indigo-150 text-indigo-600 text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                            >
                              {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                              Bắt đầu hoàn tiền
                            </button>
                          )}

                          {ret.status === "refund_processing" && (
                            <button
                              disabled={submittingId !== null}
                              onClick={() => {
                                setCompleteRefundId(ret.id);
                                setRefundMethod("Bank Transfer");
                                setRefundTxnId("");
                              }}
                              className="px-3 py-1.5 bg-purple-50 hover:bg-purple-600 hover:text-white border border-purple-150 text-purple-600 text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                            >
                              {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                              Hoàn tất hoàn tiền
                            </button>
                          )}

                          {["refunded", "return_rejected", "return_cancelled"].includes(ret.status) && (
                            <span className="text-xs text-gray-400 font-medium">Đã xong</span>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Details Accordion Block */}
                    {expandedReturnId === ret.id && (
                      <tr className="bg-gray-50/50">
                        <td colSpan={7} className="px-6 py-4 border-t border-b border-gray-150">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-gray-600 animate-fadeIn">
                            {/* Left Col: Return Request & Refund Details */}
                            <div className="bg-white border border-gray-150 rounded-2xl p-4 space-y-2 shadow-sm">
                              <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wider mb-2">Chi tiết yêu cầu trả hàng</h4>
                              <p><span className="font-bold text-gray-700">Mã yêu cầu:</span> #RET-{ret.id}</p>
                              <p><span className="font-bold text-gray-700">Mã đơn hàng:</span> #ORD-{ret.order?.id}</p>
                              <p><span className="font-bold text-gray-700">Lý do đổi trả:</span> {ret.reason}</p>
                              {ret.rejectionReason && (
                                <p className="text-red-600"><span className="font-bold text-red-800">Lý do từ chối:</span> {ret.rejectionReason}</p>
                              )}
                              
                              {ret.imageProof ? (
                                <div className="space-y-1 mt-2">
                                  <span className="font-bold text-gray-700 block">Minh chứng hình ảnh:</span>
                                  <div className="w-32 h-20 rounded border overflow-hidden relative bg-gray-50">
                                    <img
                                      src={getProofUrl(ret.imageProof)}
                                      alt="Proof Image"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        (e.target as any).src = ret.imageProof;
                                      }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <p><span className="font-bold text-gray-700">Minh chứng hình ảnh:</span> Không có minh chứng</p>
                              )}

                              {/* Refund Details */}
                              {(ret.refundMethod || ret.refundTransactionId || ret.refundedAt) && (
                                <div className="mt-3 pt-3 border-t border-gray-150 space-y-1 text-purple-700 bg-purple-50/20 p-2.5 rounded-xl">
                                  <span className="font-extrabold text-purple-800 block text-[10px] uppercase tracking-wider">Thông tin hoàn tiền</span>
                                  {ret.refundMethod && <p><span className="font-semibold text-gray-700">Phương thức:</span> {ret.refundMethod}</p>}
                                  {ret.refundTransactionId && <p><span className="font-semibold text-gray-700">Mã giao dịch:</span> <span className="font-mono bg-purple-100/50 px-1 py-0.5 rounded text-[10px]">{ret.refundTransactionId}</span></p>}
                                  {ret.refundedAt && <p><span className="font-semibold text-gray-700">Thời gian hoàn tiền:</span> {new Date(ret.refundedAt).toLocaleString("vi-VN")}</p>}
                                </div>
                              )}
                            </div>

                            {/* Right Col: Audit Timeline */}
                            <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-sm">
                              <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wider mb-2">Lịch sử trạng thái (Audit Timeline)</h4>
                              <div className="relative border-l border-gray-200 pl-4 space-y-3.5 py-1">
                                {ret.order?.statusLogs && ret.order.statusLogs.length > 0 ? (
                                  [...ret.order.statusLogs]
                                    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                    .map((log: any, idx: number) => {
                                      const getStatusLabel = (status: string) => {
                                        const labels: Record<string, string> = {
                                          pending: "Chờ thanh toán (Pending)",
                                          confirmed: "Đã xác nhận (Confirmed)",
                                          shipping: "Đang giao hàng (Shipping)",
                                          delivered: "Đã giao hàng thành công (Delivered)",
                                          cancelled: "Đã hủy đơn hàng (Cancelled)",
                                          refunded: "Đã hoàn tiền (Refunded)",
                                          return_requested: "Yêu cầu trả hàng (Return Requested)",
                                          return_approved: "Duyệt trả hàng (Return Approved)",
                                          product_received: "Kho đã nhận hàng (Product Received)",
                                          refund_processing: "Đang xử lý hoàn tiền (Refund Processing)",
                                          return_rejected: "Yêu cầu trả hàng bị từ chối (Return Rejected)",
                                          return_cancelled: "Yêu cầu trả hàng đã bị hủy (Return Cancelled)",
                                        };
                                        return labels[status] || status;
                                      };

                                      return (
                                        <div key={log.id || idx} className="relative">
                                          {/* Circle Dot */}
                                          <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border border-white" />
                                          <div className="flex justify-between items-start gap-4">
                                            <div>
                                              <p className="font-bold text-gray-800">
                                                {getStatusLabel(log.oldStatus)} <span className="font-normal text-gray-400 font-mono">→</span> {getStatusLabel(log.newStatus)}
                                              </p>
                                              {log.note && <p className="text-gray-500 italic mt-0.5 text-[10px]">"{log.note}"</p>}
                                            </div>
                                            <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                              {new Date(log.createdAt).toLocaleString("vi-VN")}
                                            </span>
                                          </div>
                                        </div>
                                      );
                                    })
                                ) : (
                                  <p className="text-gray-400 italic text-[11px]">Chưa ghi nhận nhật ký trạng thái đơn hàng.</p>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLETE REFUND MODAL */}
      {completeRefundId !== null && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 shadow-xl space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b">
              <h3 className="font-bold text-gray-800 text-lg">Thông tin giao dịch hoàn tiền</h3>
              <button 
                onClick={() => setCompleteRefundId(null)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteRefundSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Phương thức hoàn tiền</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-medium"
                >
                  <option value="Bank Transfer">Chuyển khoản ngân hàng (Bank Transfer)</option>
                  <option value="Momo">Ví điện tử Momo</option>
                  <option value="ZaloPay">Ví điện tử ZaloPay</option>
                  <option value="Cash">Tiền mặt</option>
                  <option value="Other">Khác</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Mã giao dịch hoàn tiền (Transaction ID)</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: VCB123456789"
                  value={refundTxnId}
                  onChange={(e) => setRefundTxnId(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteRefundId(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-2xl transition border"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingId !== null}
                  className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-100"
                >
                  {submittingId !== null ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  Xác nhận hoàn tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
