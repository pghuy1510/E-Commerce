"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const res = await login({ username, password });
      Cookies.set("token", res.data.access_token);
      router.push("/");
    } catch (err) {
      alert("Sai tài khoản hoặc mật khẩu");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="relative w-[1000px] h-[500px]">
        {/* KHỐI TRẮNG */}
        <div className="absolute inset-0 bg-white shadow-xl flex items-center justify-end pr-20">
          {/* FORM LOGIN */}
          <div className="w-[350px] border border-gray-200 p-8 bg-white">
            <h2 className="text-2xl font-bold mb-2">Log in</h2>
            <p className="text-sm text-gray-400 mb-6">
              Please fill your information below
            </p>

            <input
              type="text"
              placeholder="Username"
              className="w-full mb-4 p-2 border-b border-gray-200 outline-none focus:border-yellow-500 transition"
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              className="w-full mb-4 p-2 border-b border-gray-200 outline-none focus:border-yellow-500 transition"
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex justify-between text-sm mb-4 text-gray-500">
              <label>
                <input type="checkbox" className="mr-2" />
                Remember me
              </label>
              <a href="#" className="hover:text-yellow-500">
                Forgot Password?
              </a>
            </div>

            <button
              onClick={handleLogin}
              className="w-full bg-yellow-500 text-white py-2 font-semibold hover:bg-yellow-600 transition">
              LOGIN
            </button>

            {/* LINK SANG REGISTER */}
            <p className="text-sm mt-4 text-center text-gray-500">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="text-yellow-500 hover:underline">
                Đăng ký
              </Link>
            </p>
          </div>
        </div>

        {/* KHỐI VÀNG */}
        <div className="absolute left-[80px] top-[-50px] w-[400px] h-[600px] bg-yellow-500 text-white shadow-2xl flex flex-col justify-between p-10 z-10">
          {/* LOGO */}
          <div className="text-4xl">✨</div>

          {/* TEXT */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Welcome back</h1>
            <p className="text-sm opacity-90">
              Manage your shop efficiently with our system
            </p>
          </div>

          {/* IMAGE */}
          <Image
            src="/Online-Groceries-cuate.png"
            alt="banner"
            width={400}
            height={300}
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
