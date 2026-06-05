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
      alert("Cập nhật thông tin người dùng thành công!");
      setIsEditModalOpen(false);
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      setEditError(
        apiError?.response?.data?.message ||
          apiError?.message ||
          "Không thể cập nhật thông tin người dùng.",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa tài khoản này? Hành động này sẽ gỡ bỏ tài khoản và dọn dẹp các dữ liệu giỏ hàng liên quan, giữ lại lịch sử đơn hàng ở trạng thái vô danh. Không thể hoàn tác.")) return;
    try {
      setActionUserId(userId);
      await adminAPI.deleteUser(userId);
      alert("Xóa tài khoản người dùng thành công!");
      fetchUsers();
    } catch (err: unknown) {
      const apiError = err as ApiError;
      console.error(err);
      alert(
        apiError?.response?.data?.message ||
          apiError?.message ||
          "Không thể xóa tài khoản người dùng.",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const { formatPrice } = usePreferences();

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
          "Không thể tải danh sách khách hàng.",
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

    const confirmed = confirm(
      `Cập nhật quyền của ${user.username} thành ${roleLabel[nextRole] ?? nextRole}?`,
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
          "Không thể cập nhật phân quyền.",
      );
    } finally {
      setActionUserId(null);
    }
  };

  const handleToggleBan = async (user: AdminUser) => {
    const nextIsActive = !user.isActive;
    const actionText = nextIsActive ? "mở khóa" : "khóa";
    const confirmed = confirm(
      `Bạn có chắc chắn muốn ${actionText} tài khoản ${user.username}?`,
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
          "Không thể cập nhật trạng thái tài khoản.",
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
          "Không thể tải lịch sử mua hàng.",
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
            Đang tải danh sách khách hàng...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h3 className="text-lg font-bold">Không thể tải dữ liệu</h3>
        <p className="mb-4 mt-1 text-sm">{error}</p>
        <button
          type="button"
          onClick={fetchUsers}
          className="rounded-xl bg-red-600 px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-red-700">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-gray-150 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Tổng tài khoản
          </p>
          <p className="mt-2 text-3xl font-black text-gray-900">
            {users.length}
          </p>
        </div>
        <div className="rounded-3xl border border-gray-150 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Đang hoạt động
          </p>
          <p className="mt-2 text-3xl font-black text-emerald-600">
            {activeCount}
          </p>
          {bannedCount > 0 && (
            <p className="mt-1 text-xs font-semibold text-red-500">
              {bannedCount} tài khoản đang bị khóa
            </p>
          )}
        </div>
        <div className="rounded-3xl border border-gray-150 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Quản trị viên
          </p>
          <p className="mt-2 text-3xl font-black text-brand-primary">
            {adminCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-between gap-4 rounded-3xl border border-gray-150 bg-white p-6 shadow-sm md:flex-row md:items-center">
        <div className="flex max-w-3xl flex-1 flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo username, email hoặc ID..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-2xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-brand-primary"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none transition focus:border-brand-primary">
            <option value="all">Tất cả quyền</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-2xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 outline-none transition focus:border-brand-primary">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang hoạt động</option>
            <option value="banned">Đang bị khóa</option>
          </select>
        </div>

        <div className="rounded-2xl bg-brand-primary/10 px-4 py-3 text-xs font-semibold text-brand-primary">
          {filteredUsers.length} / {users.length} tài khoản
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-150 bg-white shadow-sm">
        {filteredUsers.length === 0 ? (
          <div className="py-24 text-center font-medium text-gray-400">
            Không tìm thấy khách hàng phù hợp.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-gray-150 bg-gray-50 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-4">Tài khoản</th>
                  <th className="px-6 py-4">Quyền</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Tổng chi tiêu</th>
                  <th className="px-6 py-4">Ngày tạo</th>
                  <th className="px-6 py-4 text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => {
                  const isBusy = actionUserId === user.id;

                  return (
                    <tr key={user.id} className="transition hover:bg-gray-50/40">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-primary/10 text-sm font-black text-brand-primary">
                            {user.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-gray-900">
                              {user.username}
                            </p>
                            <p className="truncate text-xs font-medium text-gray-400">
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
                          className={`rounded-xl border px-3 py-2 text-xs font-bold outline-none transition disabled:opacity-60 ${
                            user.role === "admin"
                              ? "border-brand-border bg-brand-primary/10 text-brand-primary"
                              : "border-gray-200 bg-gray-50 text-gray-600"
                          }`}>
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-extrabold uppercase ${
                            user.isActive
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : "border-red-100 bg-red-50 text-red-700"
                          }`}>
                          {user.isActive ? (
                            <ShieldCheck size={12} />
                          ) : (
                            <Ban size={12} />
                          )}
                          {user.isActive ? "Active" : "Banned"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right font-extrabold text-brand-primary">
                        {formatPrice(user.totalSpent)}
                      </td>

                      <td className="px-6 py-4 text-xs font-medium text-gray-500">
                        {new Date(user.created_at).toLocaleDateString("vi-VN", {
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
                            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-gray-600 transition hover:bg-brand-primary hover:text-white">
                            <Eye size={13} /> Đơn
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(user)}
                            className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-bold text-blue-600 transition hover:bg-blue-600 hover:text-white">
                            Sửa
                          </button>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleDeleteUser(user.id)}
                            className="flex items-center gap-1 rounded-xl border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-600 transition hover:bg-red-600 hover:text-white disabled:opacity-50">
                            {isBusy ? (
                              <Loader2 size={13} className="animate-spin" />
                            ) : (
                              <Trash2 size={13} />
                            )}
                            Xóa
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
            aria-label="Đóng lịch sử mua hàng"
            onClick={() => setSelectedUser(null)}
            className="absolute inset-0 cursor-default"
          />

          <aside className="relative z-10 flex h-full w-full max-w-xl flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                  Lịch sử mua hàng
                </p>
                <h2 className="mt-1 text-xl font-black text-gray-900">
                  {selectedUser.username}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-full p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {ordersLoading ? (
                <div className="flex items-center justify-center py-24">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
                </div>
              ) : ordersError ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-medium text-red-600">
                  {ordersError}
                </div>
              ) : userOrders.length === 0 ? (
                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
                  <ShoppingBag className="mx-auto mb-3 h-9 w-9 text-gray-300" />
                  <p className="font-semibold text-gray-500">
                    Tài khoản này chưa có đơn hàng.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {userOrders.map((order) => (
                    <div
                      key={order.id}
                      className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-black text-gray-900">
                            #ORD-{order.id}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gray-400">
                            {new Date(order.created_at).toLocaleString(
                              "vi-VN",
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
                              ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                              : order.status === "cancelled"
                                ? "border-red-100 bg-red-50 text-red-700"
                                : order.status === "shipping"
                                  ? "border-blue-100 bg-blue-50 text-blue-700"
                                  : "border-brand-border bg-brand-primary/10 text-brand-primary"
                          }`}>
                          {order.status}
                        </span>
                      </div>

                      <div className="mt-3 border-t border-gray-50 pt-3">
                        <p className="line-clamp-2 text-xs text-gray-500">
                          {order.items?.length
                            ? order.items
                                .map(
                                  (item) =>
                                    `${item.productName ?? "Sản phẩm"} x${item.quantity ?? 1}`,
                                )
                                .join(", ")
                            : "Không có dữ liệu sản phẩm"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl w-full max-w-md overflow-hidden animate-scaleIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-brand-primary/10">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">Chỉnh Sửa Tài Khoản</h3>
                <p className="text-xs text-gray-500 mt-0.5">ID Người dùng: #{editingUser.id}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditUserSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 text-xs bg-red-50 text-red-600 border border-red-100 rounded-xl flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>{editError}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tên đăng nhập *</label>
                <input
                  type="text"
                  required
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và tên</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Số điện thoại</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vai trò</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition text-gray-600 font-semibold"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</label>
                  <select
                    value={editIsActive ? "active" : "banned"}
                    onChange={(e) => setEditIsActive(e.target.value === "active")}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm outline-none focus:border-brand-primary transition text-gray-600 font-semibold"
                  >
                    <option value="active">Hoạt động</option>
                    <option value="banned">Bị khóa</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={editSubmitting}
                  className="px-5 py-2 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2 rounded-xl bg-brand-primary hover:bg-brand-primary-hover disabled:bg-brand-primary-light text-white text-sm font-semibold transition flex items-center gap-1.5"
                >
                  {editSubmitting && <Loader2 size={16} className="animate-spin" />}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
