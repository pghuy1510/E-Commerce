"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePreferences } from "@/lib/i18n";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { t } = usePreferences();

  const handleLogin = async () => {
    try {
      const res = await login({ username, password });
      Cookies.set("token", res.data.access_token, { path: "/" });
      localStorage.setItem("username", username);
      router.push("/");
    } catch (err) {
      alert(t("alert.loginFailed"));
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="relative w-[1000px] h-[500px]">
        {/* KHỐI TRẮNG */}
        <div className="absolute inset-0 bg-white shadow-xl flex items-center justify-end pr-20">
          {/* FORM LOGIN */}
          <div className="w-[350px] border border-gray-200 p-8 bg-white">
            <h2 className="text-2xl font-bold mb-2">{t("auth.loginTitle")}</h2>
            <p className="text-sm text-gray-400 mb-6">
              {t("auth.loginSubtitle")}
            </p>

            <input
              type="text"
              placeholder={t("auth.username")}
              className="w-full mb-4 p-2 border-b border-gray-200 outline-none focus:border-yellow-500 transition"
              onChange={(e) => setUsername(e.target.value)}
            />

            <input
              type="password"
              placeholder={t("auth.password")}
              className="w-full mb-4 p-2 border-b border-gray-200 outline-none focus:border-yellow-500 transition"
              onChange={(e) => setPassword(e.target.value)}
            />

            <div className="flex justify-between text-sm mb-4 text-gray-500">
              <label>
                <input type="checkbox" className="mr-2" />
                {t("auth.rememberMe")}
              </label>
              <a href="#" className="hover:text-yellow-500">
                {t("auth.forgotPassword")}
              </a>
            </div>

            {/* LOGIN THƯỜNG */}
            <button
              onClick={handleLogin}
              className="w-full bg-yellow-500 text-white py-2 font-semibold hover:bg-yellow-600 transition">
              {t("action.loginUpper")}
            </button>

            {/* --- HOẶC --- */}
            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-2 text-gray-400 text-sm">
                {t("action.or")}
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            {/* LOGIN GOOGLE */}
            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/", // 👈 login xong về trang chủ
                })
              }
              className="w-full py-2 border border-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 transition">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                className="w-5 h-5"
              />
              {t("action.continueWithGoogle")}
            </button>

            {/* LINK SANG REGISTER */}
            <p className="text-sm mt-4 text-center text-gray-500">
              {t("auth.noAccount")}{" "}
              <Link
                href="/register"
                className="text-yellow-500 hover:underline">
                {t("action.signUp")}
              </Link>
            </p>
          </div>
        </div>

        {/* KHỐI VÀNG */}
        <div className="absolute left-[80px] top-[-50px] w-[400px] h-[600px] bg-yellow-500 text-white shadow-2xl flex flex-col justify-between p-10 z-10">
          <div className="text-white">
            <ShoppingBag size={40} />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-4">
              {t("auth.welcomeBackTitle")}
            </h1>
            <p className="text-sm opacity-90">
              {t("auth.welcomeBackSubtitle")}
            </p>
          </div>

          <Image
            src="/img/Online-Groceries-cuate.png"
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
