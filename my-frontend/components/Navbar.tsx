"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User, LogOut } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { t } = usePreferences();

  useEffect(() => {
    // Check if user is logged in
    const token = Cookies.get("token");
    const storedUsername = localStorage.getItem("username");

    if (token && storedUsername) {
      setUsername(storedUsername);
    }
    setIsLoading(false);
  }, []);

  const handleLogout = () => {
    Cookies.remove("token", { path: "/" });
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setUsername(null);
    router.push("/login");
  };

  if (isLoading) {
    return (
      <nav className="w-full flex justify-between items-center px-8 py-4 bg-white shadow">
        <h1 className="font-bold text-lg">MyShop</h1>
      </nav>
    );
  }

  return (
    <nav className="w-full flex justify-between items-center px-8 py-4 bg-white shadow">
      <h1 className="font-bold text-lg">MyShop</h1>

      <div className="flex gap-6 items-center">
        <Link href="/">{t("nav.home")}</Link>
        <Link href="/shop">{t("nav.shop")}</Link>
        <Link href="/cart">{t("nav.cart")}</Link>

        {username ? (
          <div className="flex items-center gap-4 border-l pl-6">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              <span className="font-medium text-gray-800">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition">
              <LogOut size={18} />
              {t("header.logout")}
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">
              {t("action.login")}
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              {t("action.signUp")}
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
