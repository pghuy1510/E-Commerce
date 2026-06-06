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
import AdminEmptyState from "@/components/admin/AdminEmptyState";

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingId, setSubmittingId] = useState<number | null>(null);

  // Complete refund state
  const [completeRefundId, setCompleteRefundId] = useState<number | null>(null);
  const [refundMethod, setRefundMethod] = useState("");
  const [refundTxnId, setRefundTxnId] = useState("");
  
  const [expandedReturnId, setExpandedReturnId] = useState<number | null>(null);

  const { formatPrice, language } = usePreferences();

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
    const actionText = action === "approve" 
      ? (language === "vi" ? "chấp nhận yêu cầu trả hàng" : "approved return request") 
      : (language === "vi" ? "từ chối yêu cầu đổi trả" : "rejected return request");
    const note = prompt(language === "vi" ? "Nhập lý do/ghi chú phản hồi cho khách hàng (Tùy chọn):" : "Enter feedback reason/note for customer (Optional):");
    if (note === null) return; // user cancelled prompt

    try {
      setSubmittingId(id);
      await adminAPI.handleReturn(id, {
        action,
        note: note.trim() || undefined,
      });
      alert(language === "vi" ? `Đã ${actionText} thành công!` : `Successfully ${actionText}!`);
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể thực hiện thao tác lúc này." : "Cannot perform operation at this time."));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleMarkReceived = async (id: number) => {
    if (!confirm(language === "vi" ? "Xác nhận đã nhận được sản phẩm hoàn trả từ khách hàng tại kho?" : "Confirm that the returned items have been received at the warehouse?")) return;
    try {
      setSubmittingId(id);
      await adminAPI.markReturnReceived(id);
      alert(language === "vi" ? "Đã cập nhật trạng thái nhận sản phẩm thành công!" : "Successfully updated receipt status!");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể thực hiện thao tác lúc này." : "Cannot perform operation at this time."));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleStartRefund = async (id: number) => {
    if (!confirm(language === "vi" ? "Bắt đầu thực hiện quy trình hoàn tiền cho khách hàng?" : "Start refund processing for the customer?")) return;
    try {
      setSubmittingId(id);
      await adminAPI.startReturnRefund(id);
      alert(language === "vi" ? "Đã chuyển trạng thái sang Đang xử lý hoàn tiền!" : "Status updated to Refund Processing!");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể thực hiện thao tác lúc này." : "Cannot perform operation at this time."));
    } finally {
      setSubmittingId(null);
    }
  };

  const handleCompleteRefundSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completeRefundId) return;
    if (!refundMethod.trim() || !refundTxnId.trim()) {
      alert(language === "vi" ? "Vui lòng nhập đầy đủ thông tin giao dịch hoàn tiền!" : "Please enter all refund transaction details!");
      return;
    }
    try {
      setSubmittingId(completeRefundId);
      await adminAPI.completeReturnRefund(completeRefundId, {
        refundMethod: refundMethod.trim(),
        refundTransactionId: refundTxnId.trim(),
      });
      alert(language === "vi" ? "Yêu cầu trả hàng đã hoàn tất hoàn tiền thành công!" : "Refund request completed successfully!");
      setCompleteRefundId(null);
      setRefundMethod("");
      setRefundTxnId("");
      fetchReturnRequests();
    } catch (err: any) {
      console.error(err);
      alert(err?.response?.data?.message || (language === "vi" ? "Không thể thực hiện thao tác lúc này." : "Cannot perform operation at this time."));
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
          <h1 className="text-2xl font-bold text-brand-text">
            {language === "vi" ? "Quản lý Đổi trả & Hoàn tiền" : "Manage Returns & Refunds"}
          </h1>
          <p className="text-sm text-brand-muted mt-1">
            {language === "vi" ? "Xử lý yêu cầu trả hàng, nhận kho và đối soát hoàn tiền theo chu trình" : "Process return requests, warehouse receipts, and refund reconciliations"}
          </p>
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-6 shadow-sm flex items-center gap-4 group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary border border-brand-border/20">
            <History size={20} />
          </div>
          <div>
            <span className="text-xs text-brand-muted block font-bold uppercase tracking-wider">
              {language === "vi" ? "Tổng số yêu cầu" : "Total Requests"}
            </span>
            <span className="text-2xl font-black text-brand-text">{totalCount}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-6 shadow-sm flex items-center gap-4 group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-status-warning-bg text-status-warning-text rounded-2xl flex items-center justify-center border border-status-warning-border">
            <Info size={20} />
          </div>
          <div>
            <span className="text-xs text-brand-muted block font-bold uppercase tracking-wider">
              {language === "vi" ? "Chờ xét duyệt" : "Awaiting Approval"}
            </span>
            <span className="text-2xl font-black text-status-warning-text">{pendingCount}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-6 shadow-sm flex items-center gap-4 group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-status-info-bg text-status-info-text rounded-2xl flex items-center justify-center border border-status-info-border">
            <Truck size={20} />
          </div>
          <div>
            <span className="text-xs text-brand-muted block font-bold uppercase tracking-wider">
              {language === "vi" ? "Đang xử lý" : "Processing"}
            </span>
            <span className="text-2xl font-black text-status-info-text">{processingCount}</span>
          </div>
        </div>

        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-6 shadow-sm flex items-center gap-4 group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <div className="w-12 h-12 bg-status-success-bg text-status-success-text rounded-2xl flex items-center justify-center border border-status-success-border">
            <DollarSign size={20} />
          </div>
          <div>
            <span className="text-xs text-brand-muted block font-bold uppercase tracking-wider">
              {language === "vi" ? "Đã hoàn tiền" : "Refunded"}
            </span>
            <span className="text-2xl font-black text-status-success-text">{completedCount}</span>
          </div>
        </div>
      </div>

      {/* RETURN LIST CARD */}
      <div className="bg-brand-surface border border-brand-border/40 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-40">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : returns.length === 0 ? (
          <AdminEmptyState
            icon={Package}
            title={language === "vi" ? "Chưa có yêu cầu đổi trả" : "No return requests yet"}
            description={language === "vi" ? "Dữ liệu yêu cầu đổi trả / hoàn tiền sẽ xuất hiện khi khách hàng phát sinh yêu cầu." : "Return/refund request data will appear when generated by customers."}
          />
        ) : (
          <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                  <th className="px-6 py-4">{language === "vi" ? "Mã yêu cầu" : "Request ID"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Đơn hàng" : "Order"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Khách hàng" : "Customer"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Lý do & Minh chứng" : "Reason & Proof"}</th>
                  <th className="px-6 py-4 text-right">{language === "vi" ? "Hoàn tiền dự kiến" : "Estimated Refund"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Hành động" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {returns.map((ret) => {
                  const isSelected = expandedReturnId === ret.id;
                  return (
                    <Fragment key={ret.id}>
                      <tr className={`transition-colors duration-150 ${
                        isSelected
                          ? "bg-brand-primary/10 border-l-4 border-l-brand-primary"
                          : "hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50"
                      }`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 font-bold text-brand-text">
                            <button
                              type="button"
                              onClick={() => setExpandedReturnId(expandedReturnId === ret.id ? null : ret.id)}
                              className="p-1 hover:bg-brand-primary-light/20 rounded text-brand-muted hover:text-brand-primary transition cursor-pointer"
                              title={language === "vi" ? "Xem chi tiết & Lịch sử hành trình" : "View details & history"}
                            >
                              <ChevronDown size={14} className={`transform transition-transform ${expandedReturnId === ret.id ? "rotate-180 text-brand-primary" : ""}`} />
                            </button>
                            <span>#RET-{ret.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-brand-text">#ORD-{ret.order?.id}</td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-brand-text">
                            {ret.order?.user?.fullName || ret.order?.user?.username || "Guest"}
                          </div>
                          <span className="text-[10px] text-brand-muted block font-mono">{ret.order?.user?.email}</span>
                        </td>
                        <td className="px-6 py-4 max-w-xs space-y-1.5">
                          <p className="text-brand-text text-xs leading-relaxed font-medium">
                            {ret.reason}
                          </p>
                          <div className="flex gap-2">
                            {ret.imageProof ? (
                              <a
                                href={getProofUrl(ret.imageProof)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-status-info-bg text-status-info-text border border-status-info-border px-2 py-0.5 rounded font-bold hover:bg-brand-primary hover:text-white transition animate-pulse"
                              >
                                <FileImage size={10} /> {language === "vi" ? "Xem ảnh proof" : "View proof image"}
                              </a>
                            ) : (
                              <span className="text-[10px] text-brand-muted bg-brand-bg border border-brand-border/30 px-2 py-0.5 rounded">
                                {language === "vi" ? "Không minh chứng" : "No proof"}
                              </span>
                            )}
                            {ret.rejectionReason && (
                              <span className="text-[10px] text-status-danger-text bg-status-danger-bg border border-status-danger-border px-2 py-0.5 rounded font-medium block">
                                {language === "vi" ? `Từ chối: ${ret.rejectionReason}` : `Rejected: ${ret.rejectionReason}`}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-brand-primary text-sm">
                          {formatPrice(ret.refundAmount || ret.order?.totalAmount)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                            ret.status === "return_requested" ? "bg-status-warning-bg text-status-warning-text border-status-warning-border" :
                            ret.status === "return_approved" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                            ret.status === "product_received" ? "bg-status-info-bg text-status-info-text border-status-info-border" :
                            ret.status === "refund_processing" ? "bg-status-warning-bg text-status-warning-text border-status-warning-border" :
                            ret.status === "refunded" ? "bg-status-success-bg text-status-success-text border-status-success-border" :
                            ret.status === "return_rejected" ? "bg-status-danger-bg text-status-danger-text border-status-danger-border" :
                            "bg-brand-bg text-brand-text border-brand-border/30"
                          }`}>
                            {ret.status === "return_requested" && (language === "vi" ? "Chờ duyệt" : "Pending")}
                            {ret.status === "return_approved" && (language === "vi" ? "Đã duyệt / Chờ nhận hàng" : "Approved / Awaiting Items")}
                            {ret.status === "product_received" && (language === "vi" ? "Đã nhận sản phẩm" : "Product Received")}
                            {ret.status === "refund_processing" && (language === "vi" ? "Đang hoàn tiền" : "Refund Processing")}
                            {ret.status === "refunded" && (language === "vi" ? "Đã hoàn tiền" : "Refunded")}
                            {ret.status === "return_rejected" && (language === "vi" ? "Từ chối trả hàng" : "Return Rejected")}
                            {ret.status === "return_cancelled" && (language === "vi" ? "Đã hủy" : "Cancelled")}
                            {!["return_requested", "return_approved", "product_received", "refund_processing", "refunded", "return_rejected", "return_cancelled"].includes(ret.status) && ret.status}
                          </span>

                          {/* Display transaction details if completed */}
                          {ret.status === "refunded" && ret.refundMethod && (
                            <div className="mt-1.5 text-[9px] text-brand-muted text-left font-mono max-w-[150px] mx-auto bg-brand-bg p-1 rounded border border-brand-border/30">
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
                                  className="px-2.5 py-1.5 bg-status-success-bg hover:bg-emerald-600 hover:text-white border border-status-success-border text-status-success-text text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                  title={language === "vi" ? "Duyệt trả hàng" : "Approve return"}
                                >
                                  {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                  {language === "vi" ? "Duyệt" : "Approve"}
                                </button>
                                <button
                                  disabled={submittingId !== null}
                                  onClick={() => handleAction(ret.id, "reject")}
                                  className="px-2.5 py-1.5 bg-status-danger-bg hover:bg-red-600 hover:text-white border border-status-danger-border text-status-danger-text text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                                  title={language === "vi" ? "Từ chối yêu cầu" : "Reject request"}
                                >
                                  {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                                  {language === "vi" ? "Từ chối" : "Reject"}
                                </button>
                              </>
                            )}

                            {ret.status === "return_approved" && (
                              <button
                                disabled={submittingId !== null}
                                onClick={() => handleMarkReceived(ret.id)}
                                className="px-3 py-1.5 bg-status-info-bg hover:bg-blue-600 hover:text-white border border-status-info-border text-status-info-text text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <Package size={12} />}
                                {language === "vi" ? "Đã nhận hàng kho" : "Items Received"}
                              </button>
                            )}

                            {ret.status === "product_received" && (
                              <button
                                disabled={submittingId !== null}
                                onClick={() => handleStartRefund(ret.id)}
                                className="px-3 py-1.5 bg-status-info-bg hover:bg-indigo-600 hover:text-white border border-status-info-border text-status-info-text text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <DollarSign size={12} />}
                                {language === "vi" ? "Bắt đầu hoàn tiền" : "Start Refund"}
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
                                className="px-3 py-1.5 bg-status-warning-bg hover:bg-purple-600 hover:text-white border border-status-warning-border text-status-warning-text text-xs font-bold rounded-xl transition flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {submittingId === ret.id ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
                                {language === "vi" ? "Hoàn tất hoàn tiền" : "Complete Refund"}
                              </button>
                            )}

                            {["refunded", "return_rejected", "return_cancelled"].includes(ret.status) && (
                              <span className="text-xs text-brand-muted font-medium">
                                {language === "vi" ? "Đã xong" : "Done"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Accordion Block */}
                      {expandedReturnId === ret.id && (
                        <tr className="bg-brand-bg/30">
                          <td colSpan={7} className="px-6 py-4 border-t border-b border-brand-border/20">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-brand-text animate-fadeIn">
                              {/* Left Col: Return Request & Refund Details */}
                              <div className="bg-brand-surface border border-brand-border/40 rounded-2xl p-4 space-y-2 shadow-sm text-brand-text">
                                <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wider mb-2">
                                  {language === "vi" ? "Chi tiết yêu cầu trả hàng" : "Return Request Details"}
                                </h4>
                                <p><span className="font-bold text-brand-muted">{language === "vi" ? "Mã yêu cầu:" : "Request ID:"}</span> #RET-{ret.id}</p>
                                <p><span className="font-bold text-brand-muted">{language === "vi" ? "Mã đơn hàng:" : "Order ID:"}</span> #ORD-{ret.order?.id}</p>
                                <p><span className="font-bold text-brand-muted">{language === "vi" ? "Lý do đổi trả:" : "Return Reason:"}</span> {ret.reason}</p>
                                {ret.rejectionReason && (
                                  <p className="text-status-danger-text">
                                    <span className="font-bold text-status-danger-text">{language === "vi" ? "Lý do từ chối:" : "Rejection Reason:"}</span> {ret.rejectionReason}
                                  </p>
                                )}
                                
                                {ret.imageProof ? (
                                  <div className="space-y-1 mt-2">
                                    <span className="font-bold text-brand-muted block">{language === "vi" ? "Minh chứng hình ảnh:" : "Image Proof:"}</span>
                                    <div className="w-32 h-20 rounded border border-brand-border/30 overflow-hidden relative bg-gray-50">
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
                                  <p>
                                    <span className="font-bold text-brand-muted">{language === "vi" ? "Minh chứng hình ảnh:" : "Image Proof:"}</span>{" "}
                                    {language === "vi" ? "Không có minh chứng" : "No proof provided"}
                                  </p>
                                )}

                                {/* Refund Details */}
                                {(ret.refundMethod || ret.refundTransactionId || ret.refundedAt) && (
                                  <div className="mt-3 pt-3 border-t border-brand-border/10 space-y-1 text-status-success-text bg-status-success-bg p-2.5 rounded-xl">
                                    <span className="font-extrabold text-status-success-text block text-[10px] uppercase tracking-wider">
                                      {language === "vi" ? "Thông tin hoàn tiền" : "Refund Details"}
                                    </span>
                                    {ret.refundMethod && (
                                      <p>
                                        <span className="font-semibold text-brand-muted">{language === "vi" ? "Phương thức:" : "Method:"}</span>{" "}
                                        {ret.refundMethod === "Bank Transfer" ? (language === "vi" ? "Chuyển khoản ngân hàng" : "Bank Transfer") : ret.refundMethod}
                                      </p>
                                    )}
                                    {ret.refundTransactionId && (
                                      <p>
                                        <span className="font-semibold text-brand-muted">{language === "vi" ? "Mã giao dịch:" : "Transaction ID:"}</span>{" "}
                                        <span className="font-mono bg-brand-surface/50 border border-brand-border/20 px-1 py-0.5 rounded text-[10px]">{ret.refundTransactionId}</span>
                                      </p>
                                    )}
                                    {ret.refundedAt && (
                                      <p>
                                        <span className="font-semibold text-brand-muted">{language === "vi" ? "Thời gian hoàn tiền:" : "Refund Time:"}</span>{" "}
                                        {new Date(ret.refundedAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Right Col: Audit Timeline */}
                              <div className="bg-brand-surface border border-brand-border/40 rounded-2xl p-4 shadow-sm">
                                <h4 className="font-extrabold text-brand-primary text-xs uppercase tracking-wider mb-2">
                                  {language === "vi" ? "Lịch sử trạng thái (Audit Timeline)" : "Status Logs (Audit Timeline)"}
                                </h4>
                                <div className="relative border-l border-brand-border/20 pl-4 space-y-3.5 py-1">
                                  {ret.order?.statusLogs && ret.order.statusLogs.length > 0 ? (
                                    [...ret.order.statusLogs]
                                      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                                      .map((log: any, idx: number) => {
                                        const getStatusLabel = (status: string) => {
                                          const labels: Record<string, string> = {
                                            pending: language === "vi" ? "Chờ thanh toán (Pending)" : "Pending Payment (Pending)",
                                            confirmed: language === "vi" ? "Đã xác nhận (Confirmed)" : "Confirmed (Confirmed)",
                                            shipping: language === "vi" ? "Đang giao hàng (Shipping)" : "Shipping (Shipping)",
                                            delivered: language === "vi" ? "Đã giao hàng thành công (Delivered)" : "Delivered Successfully (Delivered)",
                                            cancelled: language === "vi" ? "Đã hủy đơn hàng (Cancelled)" : "Cancelled (Cancelled)",
                                            refunded: language === "vi" ? "Đã hoàn tiền (Refunded)" : "Refunded (Refunded)",
                                            return_requested: language === "vi" ? "Yêu cầu trả hàng (Return Requested)" : "Return Requested (Return Requested)",
                                            return_approved: language === "vi" ? "Duyệt trả hàng (Return Approved)" : "Return Approved (Return Approved)",
                                            product_received: language === "vi" ? "Kho đã nhận hàng (Product Received)" : "Product Received (Product Received)",
                                            refund_processing: language === "vi" ? "Đang xử lý hoàn tiền (Refund Processing)" : "Refund Processing (Refund Processing)",
                                            return_rejected: language === "vi" ? "Yêu cầu trả hàng bị từ chối (Return Rejected)" : "Return Request Rejected (Return Rejected)",
                                            return_cancelled: language === "vi" ? "Yêu cầu trả hàng đã bị hủy (Return Cancelled)" : "Return Request Cancelled (Return Cancelled)",
                                          };
                                          return labels[status] || status;
                                        };

                                        return (
                                          <div key={log.id || idx} className="relative">
                                            {/* Circle Dot */}
                                            <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-brand-primary border border-brand-surface" />
                                            <div className="flex justify-between items-start gap-4">
                                              <div>
                                                <p className="font-bold text-brand-text">
                                                  {getStatusLabel(log.oldStatus)} <span className="font-normal text-brand-muted font-mono">→</span> {getStatusLabel(log.newStatus)}
                                                </p>
                                                {log.note && <p className="text-brand-muted italic mt-0.5 text-[10px]">"{log.note}"</p>}
                                              </div>
                                              <span className="text-[10px] text-brand-muted whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })
                                  ) : (
                                    <p className="text-brand-muted italic text-[11px]">
                                      {language === "vi" ? "Chưa ghi nhận nhật ký trạng thái đơn hàng." : "No status logs recorded yet for this order."}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COMPLETE REFUND MODAL */}
      {completeRefundId !== null && (
        <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border/40">
              <h3 className="font-bold text-brand-text text-lg">
                {language === "vi" ? "Thông tin giao dịch hoàn tiền" : "Refund Transaction Info"}
              </h3>
              <button 
                onClick={() => setCompleteRefundId(null)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCompleteRefundSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  {language === "vi" ? "Phương thức hoàn tiền" : "Refund Method"}
                </label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border/30 text-brand-text rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary/30 font-medium"
                >
                  <option value="Bank Transfer">{language === "vi" ? "Chuyển khoản ngân hàng (Bank Transfer)" : "Bank Transfer"}</option>
                  <option value="Momo">{language === "vi" ? "Ví điện tử Momo" : "Momo Wallet"}</option>
                  <option value="ZaloPay">{language === "vi" ? "Ví điện tử ZaloPay" : "ZaloPay Wallet"}</option>
                  <option value="Cash">{language === "vi" ? "Tiền mặt" : "Cash"}</option>
                  <option value="Other">{language === "vi" ? "Khác" : "Other"}</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-wider text-brand-muted">
                  {language === "vi" ? "Mã giao dịch hoàn tiền (Transaction ID)" : "Refund Transaction ID"}
                </label>
                <input
                  type="text"
                  required
                  placeholder={language === "vi" ? "Ví dụ: VCB123456789" : "Example: VCB123456789"}
                  value={refundTxnId}
                  onChange={(e) => setRefundTxnId(e.target.value)}
                  className="w-full bg-brand-bg border border-brand-border/30 text-brand-text rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-primary/30 font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompleteRefundId(null)}
                  className="flex-1 py-3 text-sm font-bold text-brand-muted bg-brand-bg border border-brand-border hover:bg-brand-surface rounded-2xl transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={submittingId !== null}
                  className="flex-1 py-3 text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary-hover rounded-2xl transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  {submittingId !== null ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                  {language === "vi" ? "Xác nhận hoàn tiền" : "Confirm Refund"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
