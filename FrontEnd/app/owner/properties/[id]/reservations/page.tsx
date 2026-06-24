"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { use } from "react";
import AuthGuard from "@/components/AuthGuard";
import { reservations as reservationsApi } from "@/services/api";
import type { Reservation } from "@/types";

const STATUS_COLORS: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
  Completed: "bg-gray-100 text-gray-600",
};

function ReservationsContent({ propertyId }: { propertyId: number }) {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    reservationsApi.getByProperty(propertyId)
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  const totalRevenue = items
    .filter((r) => r.status !== "Cancelled")
    .reduce((sum, r) => sum + r.totalPrice, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/owner/properties" className="text-blue-600 text-sm hover:underline">
          ← My Properties
        </Link>
        <span className="text-gray-400">/</span>
        <h1 className="text-2xl font-bold">Property Reservations</h1>
      </div>

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">📅</p>
          <p>No reservations for this property yet.</p>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          {/* Summary bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{items.length}</p>
              <p className="text-xs text-gray-500 mt-1">Total Reservations</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-green-600">
                {items.filter((r) => r.status === "Confirmed").length}
              </p>
              <p className="text-xs text-gray-500 mt-1">Confirmed</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4 text-center">
              <p className="text-2xl font-bold text-gray-700">
                ${totalRevenue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Total Revenue</p>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b text-left">
                <tr>
                  <th className="px-4 py-3 font-semibold text-gray-600">ID</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Guest</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Check-in</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Check-out</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Price</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Status</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-500">#{r.id}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium text-sm">{r.guestName || "Guest"}</p>
                      {r.guestEmail && (
                        <p className="text-gray-500 text-xs">{r.guestEmail}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(r.checkIn).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(r.checkOut).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">
                      ${r.totalPrice.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] ?? "bg-gray-100 text-gray-600"}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default function PropertyReservationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  return (
    <AuthGuard ownerOnly>
      <ReservationsContent propertyId={Number(id)} />
    </AuthGuard>
  );
}
