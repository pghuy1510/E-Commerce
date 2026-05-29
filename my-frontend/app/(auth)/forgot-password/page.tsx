"use client";

import { useState } from "react";
import { forgotPasswordAPI } from "@/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShoppingBag, KeyRound, Mail, ShieldAlert, ArrowLeft, CheckCircle } from "lucide-react";
import { usePreferences } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const router = useRouter();
  const { t } = usePreferences();

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Please enter your email address", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      const res = await forgotPasswordAPI.forgot(email);
      
      // Development Helper: Show OTP in alert so user doesn't have to check server console
      const developerHint = res.token ? `\n[DEV MODE] Your OTP is: ${res.token}` : "";
      
      setMessage({
        text: `We have sent a verification code to your email.${developerHint}`,
        type: "success",
      });
      setStep("otp");
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err?.response?.data?.message || "Failed to request password reset. Try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword || !confirmPassword) {
      setMessage({ text: "Please fill in all verification fields", type: "error" });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ text: "Password must be at least 6 characters long", type: "error" });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return;
    }

    try {
      setLoading(true);
      setMessage(null);
      await forgotPasswordAPI.reset({
        email,
        token: otp,
        newPassword,
      });

      setMessage({
        text: "Your password has been successfully reset! Redirecting to login...",
        type: "success",
      });
      setTimeout(() => {
        router.push("/login");
      }, 2500);
    } catch (err: any) {
      console.error(err);
      setMessage({
        text: err?.response?.data?.message || "Failed to reset password. Please verify your OTP code.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100 px-4">
      <div className="relative w-[1000px] h-[550px] hidden md:block">
        {/* White container box */}
        <div className="absolute inset-0 bg-white shadow-xl flex items-center justify-end pr-20 rounded-3xl overflow-hidden">
          {/* Form Side */}
          <div className="w-[380px] border border-gray-100 p-8 bg-white rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Link href="/login" className="text-gray-400 hover:text-yellow-600 transition">
                <ArrowLeft size={20} />
              </Link>
              <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              {step === "email" 
                ? "Enter your registered email to receive a secure OTP code."
                : "Enter the 6-digit verification code sent to your email and set a new password."}
            </p>

            {message && (
              <div
                className={`mb-4 p-3 rounded-xl text-xs flex gap-2 items-start border ${
                  message.type === "success"
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-red-50 border-red-200 text-red-700"
                }`}
              >
                {message.type === "success" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
                <span className="whitespace-pre-line">{message.text}</span>
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
                  <Mail className="absolute left-1 top-2.5 text-gray-400" size={18} />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition disabled:opacity-60 text-sm shadow-md"
                >
                  {loading ? "Sending OTP..." : "Send Verification Code"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
                  <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 outline-none text-sm font-mono tracking-widest text-gray-700"
                    required
                  />
                </div>

                <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
                  <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="New Password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700"
                    required
                  />
                </div>

                <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
                  <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
                  <input
                    type="password"
                    placeholder="Confirm New Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition disabled:opacity-60 text-sm shadow-md"
                >
                  {loading ? "Resetting Password..." : "Verify & Reset Password"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm text-gray-500 hover:text-yellow-600 transition">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>

        {/* Yellow Branding Box */}
        <div className="absolute left-[80px] top-[-30px] w-[400px] h-[550px] bg-yellow-500 text-white shadow-2xl flex flex-col justify-between p-10 z-10 rounded-3xl">
          <div>
            <ShoppingBag size={44} />
          </div>

          <div>
            <h1 className="text-3xl font-bold mb-4">Secure Password Reset</h1>
            <p className="text-sm opacity-90 leading-relaxed">
              Retrieve your account access in just two quick steps. Your security and convenience are our absolute priorities.
            </p>
          </div>

          <div className="flex justify-center">
            <div className="relative w-64 h-48 bg-yellow-400 bg-opacity-25 rounded-2xl flex items-center justify-center border border-yellow-300 border-opacity-35">
              <KeyRound size={80} className="text-yellow-100 opacity-80 animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly Giao diện */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100 md:hidden">
        <div className="flex items-center gap-2 mb-2">
          <Link href="/login" className="text-gray-400 hover:text-yellow-600 transition">
            <ArrowLeft size={20} />
          </Link>
          <h2 className="text-2xl font-bold text-gray-800">Forgot Password</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">
          {step === "email" 
            ? "Enter your registered email to receive a secure OTP code."
            : "Enter the 6-digit verification code sent to your email and set a new password."}
        </p>

        {message && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs flex gap-2 items-start border ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            {message.type === "success" ? <CheckCircle size={16} className="shrink-0 mt-0.5" /> : <ShieldAlert size={16} className="shrink-0 mt-0.5" />}
            <span className="whitespace-pre-line">{message.text}</span>
          </div>
        )}

        {step === "email" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
              <Mail className="absolute left-1 top-2.5 text-gray-400" size={18} />
              <input
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700 bg-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
              <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full pl-8 pr-2 py-2 outline-none text-sm font-mono tracking-widest text-gray-700 bg-transparent"
                required
              />
            </div>

            <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
              <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700 bg-transparent"
                required
              />
            </div>

            <div className="relative border-b border-gray-200 focus-within:border-yellow-500 transition py-1">
              <KeyRound className="absolute left-1 top-2.5 text-gray-400" size={18} />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-8 pr-2 py-2 outline-none text-sm text-gray-700 bg-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 text-white py-3 rounded-xl font-semibold hover:bg-yellow-600 transition disabled:opacity-60 text-sm shadow-md"
            >
              {loading ? "Resetting Password..." : "Verify & Reset Password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-gray-500 hover:text-yellow-600 transition">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
