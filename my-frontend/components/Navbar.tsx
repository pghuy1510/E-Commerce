"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { User, LogOut } from "lucide-react";

export default function Navbar() {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

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
    Cookies.remove("token");
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
        <Link href="/">Home</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/cart">Cart</Link>

        {username ? (
          <div className="flex items-center gap-4 border-l pl-6">
            <div className="flex items-center gap-2">
              <User size={20} className="text-gray-600" />
              <span className="font-medium text-gray-800">{username}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded transition"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-blue-600 hover:text-blue-800 font-medium">
              Đăng nhập
            </Link>
            <Link href="/register" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
              Đăng ký
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
