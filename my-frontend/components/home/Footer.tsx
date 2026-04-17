"use client";

import {
  Mail,
  MapPin,
  ShoppingBag,
} from "lucide-react";
import Facebook from "next-auth/providers/facebook";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-gray-100 text-gray-700 pt-12 pb-8 px-6 md:px-20">
      {/* LINE NGĂN CÁCH */}
      <div className="mb-12">
        <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-yellow-600 to-transparent"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        {/* LEFT */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-600 p-3 rounded-full">
                <ShoppingBag className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold text-gray-900">
                E-Commerce
              </span>
            </div>
          </div>

          <p className="text-sm mb-2">Got Questions? Call us</p>
          <p className="font-semibold text-lg mb-4">+670 413 90 762</p>

          <div className="flex items-center gap-2 text-sm mb-2">
            <Mail size={16} />
            <span>phamhuyk1510@gmail.com</span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <MapPin size={16} />
            <span>
              79 Sleepy Hollow St. <br />
              Jamaica, New York 1432
            </span>
          </div>
        </div>

        {/* SUPPORT */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">
            Customers Support
          </h3>
          <ul className="space-y-2 text-sm">
            {["Store List", "Opening Hours", "Contact Us", "Return Policy"].map(
              (item) => (
                <li
                  key={item}
                  className="hover:text-yellow-600 cursor-pointer transition">
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>

        {/* CATEGORIES */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
          <ul className="space-y-2 text-sm">
            {[
              "Novel Books",
              "Poetry Books",
              "Political Books",
              "History Books",
            ].map((item) => (
              <li
                key={item}
                className="hover:text-yellow-600 cursor-pointer transition">
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* SUBSCRIBE */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-4">Subscribe.</h3>
          <p className="text-sm mb-4">
            Our conversation is just getting started
          </p>

          <div className="flex overflow-hidden rounded-md border">
            <input
              type="email"
              placeholder="Enter Your Email"
              className="flex-1 px-4 py-2 outline-none"
            />
            <button className="bg-yellow-600 text-white px-4 hover:bg-yellow-700 transition">
              Subscribe
            </button>
          </div>

          <div className="mt-6">
            <p className="mb-2 text-sm font-medium">Follow Us On</p>

            <div className="flex gap-4">
              {[
                { Icon: FaFacebookF, color: "hover:bg-blue-600" },
                { Icon: FaInstagram, color: "hover:bg-pink-500" },
                { Icon: FaTwitter, color: "hover:bg-sky-500" },
              ].map(({ Icon, color }, index) => (
                <div
                  key={index}
                  className={`
                    w-10 h-10 
                    bg-white 
                    border 
                    rounded-md 
                    flex items-center justify-center 
                    cursor-pointer 
                    transition-all duration-300
                    transform hover:rotate-12 hover:scale-110
                    ${color} hover:text-white
                    `}>
                  <Icon size={18} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* COPYRIGHT */}
      <div className="mt-12 text-center text-sm text-gray-500 border-t pt-6">
        © {new Date().getFullYear()} E-Commerce. All rights reserved.
      </div>
    </footer>
  );
}
