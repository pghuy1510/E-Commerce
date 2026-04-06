"use client";

import { useState } from "react";
import { register } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AxiosError } from "axios";

interface ApiErrorResponse {
  message?: string | string[];
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async () => {
    try {
      setError("");
      await register({ username, password });
      alert("Đăng ký thành công");
      router.push("/login");
    } catch (err) {
      const apiError = err as AxiosError<ApiErrorResponse>;
      const message = apiError.response?.data?.message;
      const normalizedMessage = Array.isArray(message)
        ? message.join(" ")
        : message;

      if (normalizedMessage?.toLowerCase().includes("already exists")) {
        setError("Tài khoản đã tồn tại.");
        return;
      }

      setError(normalizedMessage ?? "Đăng ký thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="relative w-[1000px] h-[500px]">
        {/* KHỐI TRẮNG */}
        <div className="absolute inset-0 bg-white shadow-xl flex items-center justify-end pr-20">
          {/* FORM REGISTER */}
          <div className="w-[350px] border border-gray-200 p-8 bg-white">
            <h2 className="text-2xl font-bold mb-2">Register</h2>
            <p className="text-sm text-gray-400 mb-6">
              Create your account to get started
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

            <button
              onClick={handleRegister}
              className="w-full bg-yellow-500 text-white py-2 font-semibold hover:bg-yellow-600 transition">
              REGISTER
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <p className="text-sm mt-4 text-center text-gray-500">
              Đã có tài khoản?{" "}
              <Link href="/login" className="text-yellow-500 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>

        {/* KHỐI VÀNG (ĐÈ LÊN) */}
        <div className="absolute left-[80px] top-[-50px] w-[400px] h-[600px] bg-yellow-500 text-white shadow-2xl flex flex-col justify-between p-10 z-10">
          {/* LOGO */}
          <div className="text-4xl">✨</div>

          {/* TEXT */}
          <div>
            <h1 className="text-3xl font-bold mb-4">Create account</h1>
            <p className="text-sm opacity-90">
              Start managing your store with our system today
            </p>
          </div>

          {/* IMAGE */}
          <Image
            src="/Ecommerce-web-page-cuate.png"
            alt="banner"
            width={500}
            height={500}
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
