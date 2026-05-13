"use client";

import { useMemo, useState } from "react";
import {
  Package,
  Clock3,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
} from "lucide-react";

const orders = [
  {
    id: "#ORD-1001",
    product: "Nike Air Max 270",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop",
    price: "$180",
    quantity: 1,
    total: "$180",
    status: "pending",
    date: "2026-05-12",
  },
  {
    id: "#ORD-1002",
    product: "MacBook Pro M3",
    image:
      "https://images.unsplash.com/photo-1517336714739-489689fd1ca8?q=80&w=1200&auto=format&fit=crop",
    price: "$2,199",
    quantity: 1,
    total: "$2,199",
    status: "shipping",
    date: "2026-05-10",
  },
  {
    id: "#ORD-1003",
    product: "Logitech G Pro X",
    image:
      "https://images.unsplash.com/photo-1527814050087-3793815479db?q=80&w=1200&auto=format&fit=crop",
    price: "$120",
    quantity: 2,
    total: "$240",
    status: "completed",
    date: "2026-05-08",
  },
  {
    id: "#ORD-1004",
    product: "Keychron K6 Keyboard",
    image:
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?q=80&w=1200&auto=format&fit=crop",
    price: "$90",
    quantity: 1,
    total: "$90",
    status: "cancelled",
    date: "2026-05-05",
  },
  {
    id: "#ORD-1005",
    product: "iPhone 15 Pro",
    image:
      "https://images.unsplash.com/photo-1695048133142-1a20484d2569?q=80&w=1200&auto=format&fit=crop",
    price: "$1,399",
    quantity: 1,
    total: "$1,399",
    status: "returned",
    date: "2026-05-01",
  },
];

const tabs = [
  {
    id: "all",
    label: "All",
    icon: Package,
  },
  {
    id: "pending",
    label: "Pending Payment",
    icon: Clock3,
  },
  {
    id: "shipping",
    label: "Shipping",
    icon: Truck,
  },
  {
    id: "completed",
    label: "Completed",
    icon: CheckCircle2,
  },
  {
    id: "cancelled",
    label: "Cancelled",
    icon: XCircle,
  },
  {
    id: "returned",
    label: "Returned",
    icon: RotateCcw,
  },
];

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchTab = activeTab === "all" || order.status === activeTab;

      const matchSearch =
        order.product.toLowerCase().includes(search.toLowerCase()) ||
        order.id.toLowerCase().includes(search.toLowerCase());

      return matchTab && matchSearch;
    });
  }, [activeTab, search]);

  return (
    <div className="min-h-screen bg-[#efefef] py-10 px-4 lg:px-10">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-500 mt-2">Manage and track your purchases.</p>

          {/* SEARCH */}
          <div className="mt-6 relative max-w-xl">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />

            <input
              type="text"
              placeholder="Search by product name or order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-300 bg-gray-50 outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-2xl border transition-all duration-200 text-left bg-white shadow-sm ${
                  activeTab === tab.id
                    ? "border-gray-900 bg-gray-100"
                    : "border-gray-200 hover:border-gray-400"
                }`}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      activeTab === tab.id
                        ? "bg-gray-900 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div>
                    <p className="font-semibold text-gray-900">{tab.label}</p>

                    <p className="text-sm text-gray-500">
                      {
                        orders.filter((order) =>
                          tab.id === "all" ? true : order.status === tab.id,
                        ).length
                      }{" "}
                      orders
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ORDERS */}
        <div className="space-y-5">
          {filteredOrders.length > 0 ? (
            filteredOrders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
                {/* TOP */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 border-b border-gray-100 bg-gray-50">
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">
                      {order.id}
                    </p>

                    <p className="text-gray-500 text-sm mt-1">
                      Order Date: {order.date}
                    </p>
                  </div>

                  <StatusBadge status={order.status} />
                </div>

                {/* BODY */}
                <div className="p-6 flex flex-col lg:flex-row gap-6 lg:items-center lg:justify-between">
                  <div className="flex gap-5">
                    <img
                      src={order.image}
                      alt={order.product}
                      className="w-28 h-28 object-cover rounded-2xl border"
                    />

                    <div className="space-y-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {order.product}
                      </h3>

                      <p className="text-gray-500">Price: {order.price}</p>

                      <p className="text-gray-500">
                        Quantity: {order.quantity}
                      </p>

                      <p className="text-2xl font-bold text-gray-900 pt-2">
                        {order.total}
                      </p>
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-3 lg:justify-end">
                    {order.status === "pending" && (
                      <>
                        <button className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-medium transition">
                          Pay Now
                        </button>

                        <button className="px-6 py-3 rounded-2xl border border-gray-300 hover:border-gray-500 transition font-medium">
                          Cancel Order
                        </button>
                      </>
                    )}

                    {order.status === "shipping" && (
                      <button className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-medium transition">
                        Track Order
                      </button>
                    )}

                    {order.status === "completed" && (
                      <>
                        <button className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-medium transition">
                          Buy Again
                        </button>

                        <button className="px-6 py-3 rounded-2xl border border-gray-300 hover:border-gray-500 transition font-medium">
                          Leave Review
                        </button>
                      </>
                    )}

                    {order.status === "cancelled" && (
                      <button className="px-6 py-3 rounded-2xl bg-gray-900 hover:bg-black text-white font-medium transition">
                        Order Again
                      </button>
                    )}

                    {order.status === "returned" && (
                      <button className="px-6 py-3 rounded-2xl border border-gray-300 hover:border-gray-500 transition font-medium">
                        Return Details
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-white rounded-3xl border border-gray-200 p-16 text-center shadow-sm">
              <Package className="w-14 h-14 text-gray-300 mx-auto mb-5" />

              <h3 className="text-2xl font-semibold text-gray-800">
                No orders found
              </h3>

              <p className="text-gray-500 mt-2">
                Try searching with another keyword.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    shipping: "bg-blue-100 text-blue-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    returned: "bg-gray-200 text-gray-700",
  };

  const labels: Record<string, string> = {
    pending: "Pending Payment",
    shipping: "Shipping",
    completed: "Completed",
    cancelled: "Cancelled",
    returned: "Returned",
  };

  return (
    <div
      className={`px-4 py-2 rounded-xl text-sm font-semibold ${map[status]}`}>
      {labels[status]}
    </div>
  );
}
