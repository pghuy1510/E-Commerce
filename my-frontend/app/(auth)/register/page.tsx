"use client";

import { useState } from "react";
import { register } from "@/lib/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AxiosError } from "axios";
import { Store } from "lucide-react";
import { signIn } from "next-auth/react";
import { usePreferences } from "@/lib/i18n";

interface ApiErrorResponse {
  message?: string | string[];
}

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [isUsernameValid, setIsUsernameValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const [touchedUsername, setTouchedUsername] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);

  const [error, setError] = useState("");

  const router = useRouter();
  const { t } = usePreferences();

  // validate
  const validateUsername = (value: string) => {
    return value.length >= 3 && !value.includes(" ");
  };

  const validatePassword = (value: string) => {
    return value.length >= 6;
  };

  const handleRegister = async () => {
    if (!isUsernameValid || !isPasswordValid) return;

    try {
      setError("");
      await register({ username, password });
      alert(t("alert.registerSuccess"));
      router.push("/login");
    } catch (err) {
      const apiError = err as AxiosError<ApiErrorResponse>;
      const message = apiError.response?.data?.message;
      const normalizedMessage = Array.isArray(message)
        ? message.join(" ")
        : message;

      if (normalizedMessage?.toLowerCase().includes("already exists")) {
        setError(t("alert.accountExists"));
        return;
      }

      setError(normalizedMessage ?? t("alert.registrationFailed"));
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="relative w-[1000px] h-[500px]">
        {/* KHỐI TRẮNG */}
        <div className="absolute inset-0 bg-white shadow-xl flex items-center justify-end pr-20">
          {/* FORM */}
          <div className="w-[350px] border border-gray-200 p-8 bg-white">
            <h2 className="text-2xl font-bold mb-2">
              {t("auth.registerTitle")}
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              {t("auth.registerSubtitle")}
            </p>

            {/* USERNAME */}
            <div className="relative">
              <input
                type="text"
                placeholder={t("auth.username")}
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  setUsername(value);
                  setIsUsernameValid(validateUsername(value));
                }}
                onBlur={() => setTouchedUsername(true)}
                className={`w-full mb-4 p-2 pr-10 border-b outline-none transition
                  ${
                    touchedUsername
                      ? isUsernameValid
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-200"
                  }
                  focus:border-brand-primary
                `}
              />

              {isUsernameValid && (
                <span className="absolute right-2 top-2 text-green-500 text-sm">
                  ✔
                </span>
              )}

              {touchedUsername && !isUsernameValid && username && (
                <p className="text-red-500 text-xs mt-[-10px] mb-2">
                  {t("auth.usernameValidation")}
                </p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="relative">
              <input
                type="password"
                placeholder={t("auth.password")}
                value={password}
                onChange={(e) => {
                  const value = e.target.value;
                  setPassword(value);
                  setIsPasswordValid(validatePassword(value));
                }}
                onBlur={() => setTouchedPassword(true)}
                className={`w-full mb-4 p-2 pr-10 border-b outline-none transition
                  ${
                    touchedPassword
                      ? isPasswordValid
                        ? "border-green-500"
                        : "border-red-500"
                      : "border-gray-200"
                  }
                  focus:border-brand-primary
                `}
              />

              {isPasswordValid && (
                <span className="absolute right-2 top-2 text-green-500 text-sm">
                  ✔
                </span>
              )}

              {touchedPassword && !isPasswordValid && password && (
                <p className="text-red-500 text-xs mt-[-10px] mb-2">
                  {t("auth.passwordValidation")}
                </p>
              )}
            </div>

            {/* BUTTON */}
            <button
              onClick={handleRegister}
              disabled={!isUsernameValid || !isPasswordValid}
              className={`w-full py-2 font-semibold transition text-white
                ${
                  isUsernameValid && isPasswordValid
                    ? "bg-brand-primary hover:bg-brand-primary-hover"
                    : "bg-gray-300 cursor-not-allowed"
                }
              `}>
              {t("action.registerUpper")}
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="px-2 text-gray-400 text-sm">
                {t("action.or")}
              </span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>

            <button
              onClick={() =>
                signIn("google", {
                  callbackUrl: "/",
                })
              }
              className="w-full mt-3 py-2 border border-gray-300 flex items-center justify-center gap-2 hover:bg-gray-100 transition">
              <img
                src="https://developers.google.com/identity/images/g-logo.png"
                className="w-5 h-5"
              />
              {t("action.continueWithGoogle")}
            </button>

            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

            <p className="text-sm mt-4 text-center text-gray-500">
              {t("auth.haveAccount")}{" "}
              <Link href="/login" className="text-brand-primary hover:underline">
                {t("action.login")}
              </Link>
            </p>
          </div>
        </div>

        {/* KHỐI VÀNG */}
        <div className="absolute left-[80px] top-[-50px] w-[400px] h-[600px] bg-brand-primary text-white shadow-2xl flex flex-col justify-between p-10 z-10">
          <div>
            <Store size={40} />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-4">
              {t("auth.createAccountTitle")}
            </h1>
            <p className="text-sm opacity-90">
              {t("auth.createAccountSubtitle")}
            </p>
          </div>

          <Image
            src="/img/Ecommerce-web-page-cuate.png"
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
