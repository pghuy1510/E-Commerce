"use client";

import { useSession } from "next-auth/react";

export default function ProfilePage() {
  const { data: session } = useSession();

  if (!session) {
    return <div className="p-10 text-center">Please login</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-16 px-6">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>

      <div className="bg-white shadow rounded-lg p-6 space-y-4">
        <p>
          <span className="font-semibold">Name:</span> {session.user?.name}
        </p>

        <p>
          <span className="font-semibold">Email:</span> {session.user?.email}
        </p>
      </div>
    </div>
  );
}
