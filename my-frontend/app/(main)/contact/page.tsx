"use client";

import { useState } from "react";
import { contactAPI } from "@/lib/api";

export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const handleChange = (
    key: "name" | "email" | "phone" | "message",
    value: string,
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus(null);

    if (!form.name || !form.email || !form.message) {
      setStatus("Please fill in your name, email, and message.");
      return;
    }

    try {
      setLoading(true);
      await contactAPI.create({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        message: form.message.trim(),
      });

      setStatus("Your message has been sent. We'll get back to you soon!");
      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });
    } catch (err) {
      console.error("Contact submit error:", err);
      setStatus("Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-10 py-16 max-w-5xl mx-auto">
      <h1 className="text-4xl font-bold mb-10 text-center">Contact Us</h1>

      <div className="grid md:grid-cols-2 gap-10">
        {/* INFO */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Phone</h2>
            <p className="text-gray-600">+84 971 599 019</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Email</h2>
            <p className="text-gray-600">ecommerce@gmail.com</p>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Address</h2>
            <p className="text-gray-600">Bac Giang, Vietnam</p>
          </div>
        </div>

        {/* FORM */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {status && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              {status}
            </div>
          )}

          <input
            type="text"
            placeholder="Your Name"
            value={form.name}
            onChange={(e) => handleChange("name", e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <input
            type="email"
            placeholder="Your Email"
            value={form.email}
            onChange={(e) => handleChange("email", e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <input
            type="text"
            placeholder="Phone (optional)"
            value={form.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <textarea
            placeholder="Your Message"
            rows={6}
            value={form.message}
            onChange={(e) => handleChange("message", e.target.value)}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-full transition">
            {loading ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>
    </div>
  );
}
