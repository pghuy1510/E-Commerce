"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  User,
  MapPin,
  Lock,
  CreditCard,
  Camera,
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  Check,
} from "lucide-react";
import {
  userAddressAPI,
  userBankAPI,
  userPasswordAPI,
  userProfileAPI,
  type UserBank,
  locationAPI,
  ProvinceOption,
} from "@/lib/api";
import { toLegacyAddressPayload } from "@/lib/address";
import { getBrowserToken, setAuthToken, logoutExpiredSession } from "@/lib/auth-token";
import AddressSelectorDropdown from "@/components/address-selector";

export default function ProfilePage() {
  const { data: session } = useSession();

  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 70 }, (_, i) => 2025 - i);

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [hasAuth, setHasAuth] = useState(false);

  const [profile, setProfile] = useState({
    username: "",
    fullName: "",
    email: "",
    phone: "",
    gender: "male",
    day: "",
    month: "",
    year: "",
  });

  const [password, setPassword] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [address, setAddress] = useState({
    province: "",
    commune: "",
    detail: "",
  });

  const [addresses, setAddresses] = useState<any[]>([]);
  const [provinces, setProvinces] = useState<ProvinceOption[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    receiverName: "",
    receiverPhone: "",
    provinceId: undefined as number | undefined,
    wardId: undefined as number | undefined,
    addressDetail: "",
    label: "home",
    isDefault: false,
  });
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);

  const [bank, setBank] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
  });

  const [banks, setBanks] = useState<UserBank[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const sessionToken = session?.backendAccessToken;
    const existingToken = getBrowserToken();

    if (sessionToken && sessionToken !== existingToken) {
      setAuthToken(sessionToken);
    }

    const token = sessionToken || existingToken;
    const authed = Boolean(token);
    setHasAuth(authed);

    if (!authed) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileData, addressListData, bankData, provincesData] = await Promise.all([
          userProfileAPI.get(),
          userAddressAPI.list().catch(() => []),
          userBankAPI.list(),
          locationAPI.getProvinces().catch(() => []),
        ]);

        setProvinces(provincesData);

        let day = "";
        let month = "";
        let year = "";
        if (profileData.dateOfBirth) {
          const parts = profileData.dateOfBirth.split("-");
          if (parts.length === 3) {
            year = parts[0];
            month = String(Number(parts[1]));
            day = String(Number(parts[2]));
          }
        }

        setProfile({
          username: profileData.username || "",
          fullName: profileData.fullName || "",
          email: profileData.email || "",
          phone: profileData.phone || "",
          gender: profileData.gender || "male",
          day,
          month,
          year,
        });

        setAddresses(addressListData);
        const defAddress = addressListData.find((a: any) => a.isDefault) || addressListData[0];
        setAddress({
          province: defAddress?.province || "",
          commune: defAddress?.district || "",
          detail: defAddress?.detail || "",
        });

        setBanks(bankData);
      } catch (err: any) {
        if (err.code === "TOKEN_EXPIRED") {
          void logoutExpiredSession();
          setHasAuth(false);
        } else if (err.response?.status === 401 || err.code === "AUTH_REQUIRED") {
          setAuthToken(null);
          setHasAuth(false);
        } else {
          console.error("Profile load error:", err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session]);

  const handleSaveProfile = async () => {
    if (!profile.username.trim()) {
      alert("Username is required.");
      return;
    }

    const dateOfBirth =
      profile.day && profile.month && profile.year
        ? `${profile.year}-${profile.month.padStart(2, "0")}-${profile.day.padStart(2, "0")}`
        : undefined;

    try {
      const payload: {
        username: string;
        email?: string;
        fullName?: string;
        phone?: string;
        gender?: string;
        dateOfBirth?: string;
      } = {
        username: profile.username.trim(),
        fullName: profile.fullName.trim(),
        phone: profile.phone.trim(),
        gender: profile.gender,
      };

      if (profile.email.trim()) {
        payload.email = profile.email.trim();
      }

      if (dateOfBirth) {
        payload.dateOfBirth = dateOfBirth;
      }

      const updated = await userProfileAPI.update(payload);
      if (avatarFile) {
        const formData = new FormData();

        formData.append("avatar", avatarFile);

        await userProfileAPI.uploadAvatar(formData);
      }

      if (updated.username) {
        localStorage.setItem("username", updated.username);
      }

      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert("Failed to update profile. Please try again.");
    }
  };
  const handleChooseImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    // check size
    if (file.size > 1024 * 1024) {
      alert("Image must be smaller than 1MB");
      return;
    }

    // save file
    setAvatarFile(file);

    // preview
    const imageUrl = URL.createObjectURL(file);
    setPreviewImage(imageUrl);
  };

  const handleSaveBank = async () => {
    if (!bank.bankName || !bank.accountName || !bank.accountNumber) {
      alert("Please fill in all bank fields.");
      return;
    }

    try {
      const created = await userBankAPI.create({
        bankName: bank.bankName.trim(),
        accountName: bank.accountName.trim(),
        accountNumber: bank.accountNumber.trim(),
      });

      setBanks((prev) => [created, ...prev]);
      setBank({
        bankName: "",
        accountName: "",
        accountNumber: "",
      });

      alert("Bank information saved successfully!");
    } catch (err) {
      console.error("Bank save error:", err);
      alert("Failed to save bank information.");
    }
  };

  const handleAddAddress = () => {
    setAddressForm({
      receiverName: "",
      receiverPhone: "",
      provinceId: undefined,
      wardId: undefined,
      addressDetail: "",
      label: "home",
      isDefault: false,
    });
    setEditingAddressId(null);
    setShowAddressForm(true);
  };

  const handleEditAddress = (addr: any) => {
    setAddressForm({
      receiverName: addr.receiverName || "",
      receiverPhone: addr.receiverPhone || "",
      provinceId: addr.provinceId || undefined,
      wardId: addr.wardId || undefined,
      addressDetail: addr.addressDetail || addr.detail || "",
      label: addr.label || "home",
      isDefault: addr.isDefault || false,
    });
    setEditingAddressId(addr.id);
    setShowAddressForm(true);
  };

  const handleDeleteAddress = async (id: number) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa địa chỉ này?")) {
      try {
        await userAddressAPI.remove(id);
        const list = await userAddressAPI.list();
        setAddresses(list);
        alert("Xóa địa chỉ thành công!");
      } catch (err) {
        console.error("Delete address error:", err);
        alert("Không thể xóa địa chỉ.");
      }
    }
  };

  const handleSetDefaultAddress = async (id: number) => {
    try {
      await userAddressAPI.setDefault(id);
      const list = await userAddressAPI.list();
      setAddresses(list);
      alert("Đã thiết lập địa chỉ mặc định!");
    } catch (err) {
      console.error("Set default address error:", err);
      alert("Không thể thiết lập địa chỉ mặc định.");
    }
  };

  const handleSaveAddressBook = async () => {
    if (
      !addressForm.receiverName.trim() ||
      !addressForm.receiverPhone.trim() ||
      !addressForm.provinceId ||
      !addressForm.wardId ||
      !addressForm.addressDetail.trim()
    ) {
      alert("Vui lòng điền đầy đủ các thông tin địa chỉ.");
      return;
    }

    const payload = {
      receiverName: addressForm.receiverName.trim(),
      receiverPhone: addressForm.receiverPhone.trim(),
      provinceId: addressForm.provinceId,
      wardId: addressForm.wardId,
      addressDetail: addressForm.addressDetail.trim(),
      label: addressForm.label,
      isDefault: addressForm.isDefault,
    };

    try {
      if (editingAddressId) {
        await userAddressAPI.patch(editingAddressId, payload);
        alert("Cập nhật địa chỉ thành công!");
      } else {
        await userAddressAPI.add(payload);
        alert("Thêm địa chỉ mới thành công!");
      }
      setShowAddressForm(false);
      const list = await userAddressAPI.list();
      setAddresses(list);
    } catch (err: any) {
      console.error("Save address book error:", err);
      alert(err?.response?.data?.message ?? "Không thể lưu địa chỉ. Vui lòng thử lại.");
    }
  };

  const handleChangePassword = async () => {
    if (password.newPass !== password.confirm) {
      alert("Password confirmation does not match.");
      return;
    }

    try {
      await userPasswordAPI.change({
        currentPassword: password.current,
        newPassword: password.newPass,
      });

      setPassword({
        current: "",
        newPass: "",
        confirm: "",
      });

      alert("Password updated successfully!");
    } catch (err) {
      console.error("Password update error:", err);
      alert("Failed to update password.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        Loading profile...
      </div>
    );
  }

  if (!hasAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-600 text-lg">
        Please login to view your profile.
      </div>
    );
  }

  const menus = [
    {
      id: "profile",
      label: "Profile",
      icon: User,
    },
    {
      id: "bank",
      label: "Bank",
      icon: CreditCard,
    },
    {
      id: "address",
      label: "Address",
      icon: MapPin,
    },
    {
      id: "password",
      label: "Change Password",
      icon: Lock,
    },
  ];

  const displayName =
    profile.fullName ||
    profile.username ||
    session?.user?.name ||
    session?.user?.email ||
    "User";

  return (
    <div className="bg-brand-bg min-h-screen py-10 px-4 lg:px-10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* SIDEBAR */}
        <aside className="bg-white rounded-3xl border border-gray-200 p-6 h-fit shadow-sm">
          <div className="flex items-center gap-4 border-b pb-5">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-7 h-7 text-gray-400" />
            </div>

            <div>
              <h3 className="font-semibold text-gray-800">{displayName}</h3>

              <p className="text-sm text-gray-500">Edit Profile</p>
            </div>
          </div>

          <div className="mt-6 space-y-2">
            {menus.map((menu) => {
              const Icon = menu.icon;

              return (
                <button
                  key={menu.id}
                  onClick={() => setActiveTab(menu.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border transition-all duration-200 text-left ${
                    activeTab === menu.id
                      ? "bg-brand-primary-light/40 border-brand-border text-brand-primary font-semibold"
                      : "bg-brand-surface border-transparent text-brand-muted hover:bg-brand-primary-light/20 hover:border-brand-border"
                  }`}>
                  <Icon className="w-5 h-5" />
                  {menu.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* CONTENT */}
        <section className="bg-white rounded-3xl border border-gray-200 p-6 lg:p-10 shadow-sm">
          {/* PROFILE */}
          {activeTab === "profile" && (
            <div>
              <div className="border-b pb-5 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>

                <p className="text-gray-500 mt-2">
                  Manage your profile information
                </p>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-10">
                <div className="space-y-6">
                  <FormGroup label="Username">
                    <input
                      type="text"
                      value={profile.username}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          username: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>

                  <FormGroup label="Full Name">
                    <input
                      type="text"
                      value={profile.fullName}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          fullName: e.target.value,
                        })
                      }
                      placeholder="Enter your full name"
                      className={inputClass}
                    />
                  </FormGroup>

                  <FormGroup label="Email">
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          email: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>

                  <FormGroup label="Phone Number">
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          phone: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>

                  <FormGroup label="Gender">
                    <div className="flex gap-6 pt-2">
                      {[
                        { value: "male", label: "Male" },
                        { value: "female", label: "Female" },
                        { value: "other", label: "Other" },
                      ].map((gender) => (
                        <label
                          key={gender.value}
                          className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            checked={profile.gender === gender.value}
                            onChange={() =>
                              setProfile({
                                ...profile,
                                gender: gender.value,
                              })
                            }
                          />

                          {gender.label}
                        </label>
                      ))}
                    </div>
                  </FormGroup>

                  <FormGroup label="Date of Birth">
                    <div className="grid grid-cols-3 gap-4">
                      {/* DAY */}
                      <SelectBox
                        value={profile.day}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            day: e.target.value,
                          })
                        }>
                        <option value="">Day</option>

                        {days.map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </SelectBox>

                      {/* MONTH */}
                      <SelectBox
                        value={profile.month}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            month: e.target.value,
                          })
                        }>
                        <option value="">Month</option>

                        {months.map((month) => (
                          <option key={month} value={month}>
                            {month}
                          </option>
                        ))}
                      </SelectBox>

                      {/* YEAR */}
                      <SelectBox
                        value={profile.year}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            year: e.target.value,
                          })
                        }>
                        <option value="">Year</option>

                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </SelectBox>
                    </div>
                  </FormGroup>

                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className={buttonClass}>
                    Save
                  </button>
                </div>

                {/* AVATAR */}
                {/* AVATAR */}
                <div className="border-l pl-10 flex flex-col items-center">
                  {/* PREVIEW */}
                  <div className="w-36 h-36 rounded-full overflow-hidden bg-gray-100 border flex items-center justify-center">
                    {previewImage ? (
                      <img
                        src={previewImage}
                        alt="avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-16 h-16 text-gray-400" />
                    )}
                  </div>

                  {/* INPUT FILE */}
                  <label className="mt-6 border border-gray-300 hover:border-gray-500 transition px-6 py-2 rounded-2xl flex items-center gap-2 cursor-pointer">
                    <Camera className="w-4 h-4" />
                    Choose Image
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={handleChooseImage}
                    />
                  </label>

                  <div className="text-center text-sm text-gray-400 mt-5 leading-6">
                    <p>Maximum file size 1 MB</p>
                    <p>Format: .JPEG, .PNG</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* BANK */}
          {activeTab === "bank" && (
            <div>
              <div className="border-b pb-5 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                  Bank Account
                </h1>

                <p className="text-gray-500 mt-2">
                  Manage your bank account information
                </p>
              </div>

              <div className="space-y-6 max-w-2xl">
                {banks.length > 0 && (
                  <div className="space-y-3">
                    {banks.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3">
                        <p className="font-semibold text-gray-800">
                          {item.bankName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Account: {item.accountName}
                        </p>
                        <p className="text-sm text-gray-500">
                          No: {item.accountNumber}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                <FormGroup label="Bank Name">
                  <input
                    type="text"
                    value={bank.bankName}
                    onChange={(e) =>
                      setBank({
                        ...bank,
                        bankName: e.target.value,
                      })
                    }
                    placeholder="Example: Vietcombank"
                    className={inputClass}
                  />
                </FormGroup>

                <FormGroup label="Account Holder">
                  <input
                    type="text"
                    value={bank.accountName}
                    onChange={(e) =>
                      setBank({
                        ...bank,
                        accountName: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormGroup>

                <FormGroup label="Account Number">
                  <input
                    type="text"
                    value={bank.accountNumber}
                    onChange={(e) =>
                      setBank({
                        ...bank,
                        accountNumber: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormGroup>

                <button
                  type="button"
                  onClick={handleSaveBank}
                  className={buttonClass}>
                  Add Bank
                </button>
              </div>
            </div>
          )}

          {/* ADDRESS */}
          {activeTab === "address" && (
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 mb-8 gap-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <MapPin className="w-8 h-8 text-brand-primary" />
                    Sổ địa chỉ
                  </h1>
                  <p className="text-gray-500 mt-2">
                    Quản lý danh sách địa chỉ nhận hàng của bạn
                  </p>
                </div>
                {!showAddressForm && (
                  <button
                    type="button"
                    onClick={handleAddAddress}
                    className="flex items-center gap-2 px-5 py-2.5 bg-brand-primary text-white rounded-2xl font-semibold hover:bg-brand-primary-hover transition shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    Thêm địa chỉ mới
                  </button>
                )}
              </div>

              {showAddressForm ? (
                <div className="bg-white rounded-3xl border border-brand-border p-6 md:p-8 space-y-6 max-w-3xl shadow-sm">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingAddressId ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ nhận hàng mới"}
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <FormGroup label="Họ và tên người nhận">
                      <input
                        type="text"
                        value={addressForm.receiverName}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            receiverName: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="Nguyễn Văn A"
                      />
                    </FormGroup>

                    <FormGroup label="Số điện thoại nhận hàng">
                      <input
                        type="text"
                        value={addressForm.receiverPhone}
                        onChange={(e) =>
                          setAddressForm({
                            ...addressForm,
                            receiverPhone: e.target.value,
                          })
                        }
                        className={inputClass}
                        placeholder="09XXXXXXXX"
                      />
                    </FormGroup>
                  </div>

                  <div className="col-span-full">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Địa chỉ nhận hàng
                    </label>
                    <AddressSelectorDropdown
                      value={{
                        provinceId: addressForm.provinceId,
                        wardId: addressForm.wardId,
                        addressDetail: addressForm.addressDetail,
                      }}
                      provinces={provinces}
                      onChange={(val) =>
                        setAddressForm({
                          ...addressForm,
                          provinceId: val.provinceId,
                          wardId: val.wardId,
                          addressDetail: val.addressDetail || "",
                        })
                      }
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Loại địa chỉ
                    </label>
                    <div className="flex gap-4">
                      {["home", "work", "other"].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => setAddressForm({ ...addressForm, label: lbl })}
                          className={`px-5 py-2.5 rounded-2xl text-sm font-semibold border transition ${
                            addressForm.label === lbl
                              ? "border-brand-primary bg-brand-primary-light/40 text-brand-primary font-bold shadow-sm"
                              : "border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {lbl === "home" ? "Nhà riêng" : lbl === "work" ? "Văn phòng / Công ty" : "Khác"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={addressForm.isDefault}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, isDefault: e.target.checked })
                      }
                      className="w-5 h-5 text-brand-primary border-gray-300 rounded focus:ring-brand-primary"
                    />
                    <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Đặt làm địa chỉ nhận hàng mặc định
                    </label>
                  </div>

                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={handleSaveAddressBook}
                      className="px-6 py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-2xl transition shadow-sm"
                    >
                      Lưu địa chỉ
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddressForm(false)}
                      className="px-6 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-2xl transition"
                    >
                      Hủy bỏ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
                  {addresses.length === 0 ? (
                    <div className="col-span-full border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      Bạn chưa thêm địa chỉ nhận hàng nào.
                      <button
                        type="button"
                        onClick={handleAddAddress}
                        className="block mt-4 mx-auto px-5 py-2.5 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-2xl font-semibold transition"
                      >
                        Thêm địa chỉ ngay
                      </button>
                    </div>
                  ) : (
                    addresses.map((addr) => (
                      <div
                        key={addr.id}
                        className={`bg-white rounded-3xl border p-6 flex flex-col justify-between transition duration-200 relative ${
                          addr.isDefault
                            ? "border-brand-primary bg-brand-primary-light/10 shadow-sm"
                            : "border-gray-200 hover:border-brand-primary"
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h3 className="font-bold text-gray-900 text-base">
                                {addr.receiverName || "Người nhận"}
                              </h3>
                              <p className="text-sm font-medium text-gray-500 font-mono">
                                {addr.receiverPhone || "Chưa có SĐT"}
                              </p>
                            </div>
                            <div className="flex gap-1.5 flex-wrap">
                              <span className="text-[10px] uppercase font-bold text-brand-primary bg-brand-primary-light/40 px-2 py-0.5 rounded border border-brand-border">
                                {addr.label === "work" ? "Công ty" : addr.label === "home" ? "Nhà riêng" : "Khác"}
                              </span>
                              {addr.isDefault && (
                                <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                                  <Check className="w-3 h-3" /> Mặc định
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-gray-600 leading-relaxed">
                            {addr.formattedAddress}
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => handleEditAddress(addr)}
                              className="text-sm font-semibold text-brand-primary hover:text-brand-primary-hover flex items-center gap-1"
                            >
                              <Edit2 className="w-4 h-4" /> Sửa
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-sm font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                            >
                              <Trash2 className="w-4 h-4" /> Xóa
                            </button>
                          </div>

                          {!addr.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(addr.id)}
                              className="text-xs font-bold text-gray-500 hover:text-brand-primary uppercase tracking-wider"
                            >
                              Đặt mặc định
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* PASSWORD */}
          {activeTab === "password" && (
            <div>
              <div className="border-b pb-5 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">
                  Change Password
                </h1>

                <p className="text-gray-500 mt-2">Keep your account secure</p>
              </div>

              <div className="space-y-6 max-w-2xl">
                <FormGroup label="Current Password">
                  <input
                    type="password"
                    value={password.current}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        current: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormGroup>

                <FormGroup label="New Password">
                  <input
                    type="password"
                    value={password.newPass}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        newPass: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormGroup>

                <FormGroup label="Confirm Password">
                  <input
                    type="password"
                    value={password.confirm}
                    onChange={(e) =>
                      setPassword({
                        ...password,
                        confirm: e.target.value,
                      })
                    }
                    className={inputClass}
                  />
                </FormGroup>

                <button
                  type="button"
                  onClick={handleChangePassword}
                  disabled={
                    !password.current ||
                    !password.newPass ||
                    password.newPass !== password.confirm
                  }
                  className={`px-10 py-3 rounded-2xl font-medium transition text-white ${
                    !password.current ||
                    !password.newPass ||
                    password.newPass !== password.confirm
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-gray-900 hover:bg-black"
                  }`}>
                  Update Password
                </button>

                {password.confirm && password.newPass !== password.confirm && (
                  <p className="text-red-500 text-sm">
                    Password confirmation does not match.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function FormGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[180px_1fr] items-start gap-4 md:gap-8">
      <label className="text-gray-600 font-medium pt-3">{label}</label>

      {children}
    </div>
  );
}

function SelectBox({
  children,
  value,
  onChange,
}: {
  children: React.ReactNode;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        className="w-full h-12 px-4 rounded-2xl border border-brand-border bg-brand-primary-light/20 text-brand-text appearance-none outline-none focus:ring-2 focus:ring-brand-primary/40 transition">
        {children}
      </select>

      <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" />
    </div>
  );
}

const inputClass =
  "w-full h-12 px-4 rounded-2xl border border-brand-border bg-brand-primary-light/20 text-brand-text outline-none focus:ring-2 focus:ring-brand-primary/40 transition";

const buttonClass =
  "bg-brand-primary hover:bg-brand-primary-hover transition text-white px-10 py-3 rounded-2xl font-medium shadow-sm disabled:opacity-50";
