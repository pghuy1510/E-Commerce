"use client";

export default function ContactPage() {
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
        <form className="space-y-5">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <input
            type="email"
            placeholder="Your Email"
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <textarea
            placeholder="Your Message"
            rows={6}
            className="w-full border rounded-xl px-4 py-3 outline-none focus:border-yellow-600"
          />

          <button
            type="submit"
            className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-full transition">
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
