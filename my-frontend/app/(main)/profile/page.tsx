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
} from "lucide-react";
import {
  userAddressAPI,
  userBankAPI,
  userPasswordAPI,
  userProfileAPI,
  type UserBank,
} from "@/lib/api";
import { getBrowserToken, setAuthToken } from "@/lib/auth-token";

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
    district: "",
    ward: "",
    detail: "",
  });

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
        const [profileData, addressData, bankData] = await Promise.all([
          userProfileAPI.get(),
          userAddressAPI.get(),
          userBankAPI.list(),
        ]);

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

        setAddress({
          province: addressData.province || "",
          district: addressData.district || "",
          ward: addressData.ward || "",
          detail: addressData.detail || "",
        });

        setBanks(bankData);
      } catch (err) {
        console.error("Profile load error:", err);
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

  const handleSaveAddress = async () => {
    try {
      await userAddressAPI.update({
        province: address.province.trim(),
        district: address.district.trim(),
        ward: address.ward.trim(),
        detail: address.detail.trim(),
      });
      alert("Address saved successfully!");
    } catch (err) {
      console.error("Address save error:", err);
      alert("Failed to save address.");
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
    <div className="bg-[#efefef] min-h-screen py-10 px-4 lg:px-10">
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
                      ? "bg-gray-100 border-gray-300 text-gray-900 font-semibold"
                      : "bg-[#f7f7f7] border-transparent text-gray-600 hover:bg-gray-100 hover:border-gray-300"
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
              <div className="border-b pb-5 mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Address</h1>

                <p className="text-gray-500 mt-2">
                  Manage your shipping address
                </p>
              </div>

              <div className="space-y-6 max-w-3xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormGroup label="Province / City">
                    <input
                      type="text"
                      value={address.province}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          province: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>

                  <FormGroup label="District">
                    <input
                      type="text"
                      value={address.district}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          district: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormGroup label="Ward">
                    <input
                      type="text"
                      value={address.ward}
                      onChange={(e) =>
                        setAddress({
                          ...address,
                          ward: e.target.value,
                        })
                      }
                      className={inputClass}
                    />
                  </FormGroup>
                </div>

                <FormGroup label="Detailed Address">
                  <textarea
                    rows={5}
                    value={address.detail}
                    onChange={(e) =>
                      setAddress({
                        ...address,
                        detail: e.target.value,
                      })
                    }
                    placeholder="House number, street name..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-gray-300 transition resize-none"
                  />
                </FormGroup>

                <button
                  type="button"
                  onClick={handleSaveAddress}
                  className={buttonClass}>
                  Save Address
                </button>
              </div>
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
        className="w-full h-12 px-4 rounded-2xl border border-gray-300 bg-gray-50 appearance-none outline-none focus:ring-2 focus:ring-gray-300 transition">
        {children}
      </select>

      <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
    </div>
  );
}

const inputClass =
  "w-full h-12 px-4 rounded-2xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-gray-300 transition";

const buttonClass =
  "bg-gray-900 hover:bg-black transition text-white px-10 py-3 rounded-2xl font-medium shadow-sm";
