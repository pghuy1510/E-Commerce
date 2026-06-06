"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Eye,
  Loader2,
  Search,
  ShieldCheck,
  ShoppingBag,
  Unlock,
  UserCog,
  X,
  Trash2,
} from "lucide-react";
import { adminAPI } from "@/lib/api";
import { usePreferences } from "@/lib/i18n";
import AdminEmptyState from "@/components/admin/AdminEmptyState";

type AdminUser = {
  id: number;
  username: string;
  email?: string | null;
  role: "admin" | "user" | string;
  isActive: boolean;
  created_at: string;
  totalSpent: number;
};

type UserOrder = {
  id: number;
  status: string;
  totalAmount: number;
  created_at: string;
  items?: Array<{
    productName?: string;
    quantity?: number;
  }>;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const roleLabel: Record<string, string> = {
  admin: "Admin",
  user: "User",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionUserId, setActionUserId] = useState<number | null>(null);

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userOrders, setUserOrders] = useState<UserOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editFullName, setEditFullName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editIsActive, setEditIsActive] = useState(true);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const handleOpenEditModal = (user: AdminUser) => {
    setEditingUser(user);
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditFullName((user as any).fullName || "");
    setEditPhone((user as any).phone || "");
    setEditRole(user.role);
    setEditIsActive(user.isActive);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const { formatPrice, language } = usePreferences();

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditSubmitting(true);
      setEditError(null);
      await adminAPI.updateUser(editingUser.id, {
        username: editUsername.trim(),
        email: editEmail.trim() || undefined,
        fullName: editFullName.trim() || undefined,
        phone: editPhone.trim() || undefined,
        role: editRole,
        isActive: editIsActive,
      });
      alert(language === "vi" ? "Cập nhật thông tin người dùng thành công!" : "User profile updated successfully!");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      setEditError(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể cập nhật thông tin người dùng." : "Failed to update user profile.")
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(language === "vi" 
      ? "Bạn có chắc chắn muốn xóa tài khoản này? Hành động này sẽ gỡ bỏ tài khoản và dọn dẹp các dữ liệu giỏ hàng liên quan, giữ lại lịch sử đơn hàng ở trạng thái vô danh. Không thể hoàn tác."
      : "Are you sure you want to delete this account? This will remove the account and clear associated cart items, leaving order history anonymous. This action cannot be undone."
    )) return;
    try {
      setActionUserId(userId);
      await adminAPI.deleteUser(userId);
      alert(language === "vi" ? "Xóa tài khoản người dùng thành công!" : "User account deleted successfully!");
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      alert(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể xóa tài khoản người dùng." : "Cannot delete user account.")
      );
    } finally {
      setActionUserId(null);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminAPI.getUsers();
      setUsers(data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      setError(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể tải danh sách khách hàng." : "Failed to load customers list.")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !normalizedSearch ||
        user.username.toLowerCase().includes(normalizedSearch) ||
        (user.email ?? "").toLowerCase().includes(normalizedSearch) ||
        String(user.id).includes(normalizedSearch);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && user.isActive) ||
        (statusFilter === "banned" && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [roleFilter, searchTerm, statusFilter, users]);

  const handleRoleChange = async (user: AdminUser, nextRole: string) => {
    if (user.role === nextRole) return;

    const targetRoleText = nextRole === "admin" 
      ? (language === "vi" ? "Admin" : "Admin") 
      : (language === "vi" ? "User" : "User");
    const confirmed = confirm(
      language === "vi"
        ? `Cập nhật quyền của ${user.username} thành ${targetRoleText}?`
        : `Update role of ${user.username} to ${targetRoleText}?`
    );
    if (!confirmed) return;

    try {
      setActionUserId(user.id);
      await adminAPI.updateUserRole(user.id, nextRole);
      await fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      alert(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể cập nhật phân quyền." : "Cannot update user role.")
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    const nextIsActive = !user.isActive;
    const actionText = nextIsActive 
      ? (language === "vi" ? "mở khóa" : "unban") 
      : (language === "vi" ? "khóa" : "ban");
    const confirmed = confirm(
      language === "vi"
        ? `Bạn có chắc chắn muốn ${actionText} tài khoản ${user.username}?`
        : `Are you sure you want to ${actionText} the account ${user.username}?`
    );
    if (!confirmed) return;

    try {
      setActionUserId(user.id);
      await adminAPI.banUser(user.id, nextIsActive);
      await fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      alert(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể cập nhật trạng thái tài khoản." : "Cannot update account status.")
      );
    } finally {
      setActionUserId(null);
    }
  };

  const openOrdersDrawer = async (user: AdminUser) => {
    setSelectedUser(user);
    setUserOrders([]);
    setOrdersError(null);
    setOrdersLoading(true);

    try {
      const data = await adminAPI.getUserOrders(user.id);
      setUserOrders(data);
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      setOrdersError(
        apiError?.response?.data?.message ||
          apiError?.message ||
          (language === "vi" ? "Không thể tải lịch sử mua hàng." : "Failed to load purchase history.")
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  const activeCount = users.filter((user) => user.isActive).length;
  const bannedCount = users.length - activeCount;
  const adminCount = users.filter((user) => user.role === "admin").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
          <p className="font-medium text-gray-500">
            {language === "vi" ? "Đang tải danh sách khách hàng..." : "Loading customers list..."}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-status-danger-border bg-status-danger-bg p-6 text-center text-status-danger-text">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-status-danger-text" />
        <h3 className="text-lg font-bold">{language === "vi" ? "Không thể tải dữ liệu" : "Failed to load data"}</h3>
        <p className="mb-4 mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchUsers}
          className="rounded-xl bg-brand-primary px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-brand-primary-hover cursor-pointer">
          {language === "vi" ? "Thử lại" : "Retry"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-5 shadow-sm group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            {language === "vi" ? "Tổng tài khoản" : "Total Accounts"}
          </p>
          <p className="mt-2 text-3xl font-black text-brand-text">
            {users.length}
          </p>
        </div>
        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-5 shadow-sm group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            {language === "vi" ? "Đang hoạt động" : "Active"}
          </p>
          <p className="mt-2 text-3xl font-black text-status-success-text">
            {activeCount}
          </p>
          {bannedCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-status-danger-text">
              {language === "vi" ? `${bannedCount} tài khoản đang bị khóa` : `${bannedCount} account(s) banned`}
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-brand-border/40 bg-brand-surface p-5 shadow-sm group hover:border-brand-primary/30 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
          <p className="text-xs font-bold uppercase tracking-wider text-brand-muted">
            {language === "vi" ? "Quản trị viên" : "Administrators"}
          </p>
          <p className="mt-2 text-3xl font-black text-brand-primary">
            {adminCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-brand-border/40 bg-brand-surface p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex max-w-3xl flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
            <input
              type="text"
              placeholder={language === "vi" ? "Tìm theo username, email hoặc ID..." : "Search by username, email, or ID..."}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-brand-border/30 bg-brand-bg py-2.5 pl-10 pr-4 text-sm text-brand-text outline-none transition placeholder:text-brand-muted focus:border-brand-primary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-2xl border border-brand-border/30 bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-text outline-none transition focus:border-brand-primary">
            <option value="all">{language === "vi" ? "Tất cả quyền" : "All Roles"}</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-brand-border/30 bg-brand-surface px-4 py-2.5 text-sm font-semibold text-brand-text outline-none transition focus:border-brand-primary">
            <option value="all">{language === "vi" ? "Tất cả trạng thái" : "All Statuses"}</option>
            <option value="active">{language === "vi" ? "Đang hoạt động" : "Active"}</option>
            <option value="banned">{language === "vi" ? "Đang bị khóa" : "Banned"}</option>
          </select>
        </div>

        <div className="rounded-2xl bg-brand-primary/10 px-4 py-3 text-xs font-semibold text-brand-primary border border-brand-primary/20">
          {filteredUsers.length} / {users.length} {language === "vi" ? "tài khoản" : "accounts"}
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-brand-border/40 bg-brand-surface shadow-sm">
        {filteredUsers.length === 0 ? (
          <AdminEmptyState
            icon={UserCog}
            title={language === "vi" ? "Không tìm thấy khách hàng" : "No customers found"}
            description={language === "vi" ? "Không tìm thấy khách hàng phù hợp với bộ lọc hiện tại." : "No customers match the current filters."}
          />
        ) : (
          <div className="overflow-x-auto relative max-h-[600px] overflow-y-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-brand-surface/95 backdrop-blur-sm border-b border-brand-border/40 text-brand-muted font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.03)]">
                  <th className="px-6 py-4">{language === "vi" ? "Tài khoản" : "Account"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Quyền" : "Role"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Trạng thái" : "Status"}</th>
                  <th className="px-6 py-4 text-right">{language === "vi" ? "Tổng chi tiêu" : "Total Spent"}</th>
                  <th className="px-6 py-4">{language === "vi" ? "Ngày tạo" : "Created Date"}</th>
                  <th className="px-6 py-4 text-center">{language === "vi" ? "Thao tác" : "Actions"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border/10">
                {filteredUsers.map((user) => {
                  const isBusy = actionUserId === user.id;
                  const isSelected = selectedUser?.id === user.id;

                  return (
                    <tr
                      key={user.id}
                      className={`transition-colors duration-150 ${
                        isSelected
                          ? "bg-brand-primary/10 border-l-4 border-l-brand-primary"
                          : "hover:bg-brand-bg/20 odd:bg-brand-surface even:bg-brand-bg/50"
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 border border-brand-border/20 text-sm font-black text-brand-primary">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-brand-text">
                              {user.username}
                            </p>
                            <p className="truncate text-xs font-medium text-brand-muted">
                              {user.email || `User ID #${user.id}`}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={user.role}
                          disabled={isBusy}
                          onChange={(event) =>
                              handleRoleChange(user, event.target.value)
                          }
                          className={`rounded-xl border px-3 py-2 text-xs font-bold outline-none transition disabled:opacity-60 bg-brand-bg ${
                            user.role === "admin"
                              ? "border-brand-primary/30 text-brand-primary focus:border-brand-primary"
                              : "border-brand-border/30 text-brand-text focus:border-brand-primary"
                          }`}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                            user.isActive
                              ? "border-status-success-border bg-status-success-bg text-status-success-text"
                              : "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                          }`}>
                          {user.isActive ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <Ban size={12} />
                          )}
                          {user.isActive 
                            ? (language === "vi" ? "Hoạt động" : "Active") 
                            : (language === "vi" ? "Bị khóa" : "Banned")}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold text-brand-primary">
                        {formatPrice(user.totalSpent)}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-brand-muted">
                        {new Date(user.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => openOrdersDrawer(user)}
                            className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs font-bold text-brand-text transition hover:bg-brand-primary hover:text-white cursor-pointer">
                            <Eye size={13} /> {language === "vi" ? "Đơn" : "Orders"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="flex items-center gap-1 rounded-xl border border-brand-border bg-brand-surface px-2.5 py-1.5 text-xs font-bold text-brand-primary transition hover:bg-brand-primary hover:text-white cursor-pointer">
                            {language === "vi" ? "Sửa" : "Edit"}
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center gap-1 rounded-xl border border-status-danger-border bg-status-danger-bg px-2.5 py-1.5 text-xs font-bold text-status-danger-text transition hover:bg-red-600 hover:text-white disabled:opacity-50 cursor-pointer">
                            {isBusy ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            {language === "vi" ? "Xóa" : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedUser && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
          <button
            type="button"
            aria-label={language === "vi" ? "Đóng lịch sử mua hàng" : "Close purchase history"}
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-brand-surface text-brand-text border-l border-brand-border/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-brand-border/40 px-6 py-5 bg-brand-primary-light/5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  {language === "vi" ? "Lịch sử mua hàng" : "Purchase History"}
                </p>
                <h2 className="mt-1 text-xl font-black text-brand-text">
                  {selectedUser.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-2 text-brand-muted hover:bg-brand-primary-light/20 hover:text-brand-primary transition cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : ordersError ? (
                <div className="rounded-2xl border border-status-danger-border bg-status-danger-bg p-4 text-sm font-medium text-status-danger-text">
                  {ordersError}
                </div>
              ) : userOrders.length === 0 ? (
                <div className="rounded-2xl border border-brand-border/30 bg-brand-bg/50 p-8 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-9 w-9 text-brand-muted" />
                  <p className="font-semibold text-brand-muted">
                    {language === "vi" ? "Tài khoản này chưa có đơn hàng." : "This account has no orders."}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-brand-border/30 bg-brand-bg/50 p-4 shadow-sm hover:border-brand-primary/30 transition-all">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-brand-text">
                            #ORD-{order.id}
                          </p>
                          <p className="mt-1 text-xs font-medium text-brand-muted">
                            {new Date(order.created_at).toLocaleString(
                              language === "vi" ? "vi-VN" : "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </p>
                        </div>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                            order.status === "delivered"
                              ? "border-status-success-border bg-status-success-bg text-status-success-text"
                              : order.status === "cancelled"
                                ? "border-status-danger-border bg-status-danger-bg text-status-danger-text"
                                : order.status === "shipping"
                                  ? "border-status-info-border bg-status-info-bg text-status-info-text"
                                  : "border-status-warning-border bg-status-warning-bg text-status-warning-text"
                          }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3 border-t border-brand-border/10 pt-3">
                        <p className="line-clamp-2 text-xs text-brand-muted">
                          {order.items?.length
                            ? order.items
                                .map(
                                  (item) =>
                                    `${item.productName ?? (language === "vi" ? "Sản phẩm" : "Product")} x${item.quantity ?? 1}`,
                                )
                                .join(", ")
                            : (language === "vi" ? "Không có dữ liệu sản phẩm" : "No product data available")}
                        </p>
                        <p className="mt-3 text-right text-base font-black text-brand-primary">
                          {formatPrice(order.totalAmount)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* EDIT USER MODAL */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm animate-fadeIn">
          <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-2xl ring-1 ring-brand-border/20 w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border/40 bg-brand-primary-light/10">
              <div>
                <h3 className="font-extrabold text-brand-text text-base">
                  {language === "vi" ? "Chỉnh Sửa Tài Khoản" : "Edit Account"}
                </h3>
                <p className="text-xs text-brand-muted mt-0.5">
                  {language === "vi" ? `ID Người dùng: #${editingUser.id}` : `User ID: #${editingUser.id}`}
                </p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-brand-primary-light/20 text-brand-muted hover:text-brand-primary transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-xs bg-status-danger-bg text-status-danger-text border border-status-danger-border rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                  {language === "vi" ? "Tên đăng nhập *" : "Username *"}
                </label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                  {language === "vi" ? "Họ và tên" : "Full Name"}
                </label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                  {language === "vi" ? "Số điện thoại" : "Phone Number"}
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Vai trò" : "Role"}
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition font-semibold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-muted uppercase tracking-wider">
                    {language === "vi" ? "Trạng thái" : "Status"}
                  </label>
                  <select
                    value={editIsActive ? "active" : "banned"}
                    onChange={(e) => setEditIsActive(e.target.value === "active")}
                    className="w-full rounded-xl border border-brand-border/30 bg-brand-bg px-3 py-2 text-sm text-brand-text outline-none focus:border-brand-primary transition font-semibold"
                  >
                    <option value="active">{language === "vi" ? "Hoạt động" : "Active"}</option>
                    <option value="banned">{language === "vi" ? "Bị khóa" : "Banned"}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-brand-border/10">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl border border-brand-border hover:bg-brand-bg text-sm font-semibold text-brand-muted transition cursor-pointer"
                >
                  {language === "vi" ? "Hủy bỏ" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {editSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {language === "vi" ? "Lưu" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
