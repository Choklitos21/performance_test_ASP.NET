"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { reservations as reservationsApi } from "@/services/api";
import type { Reservation } from "@/types";

const statusColors: Record<string, string> = {
  Confirmed: "bg-green-100 text-green-700",
  Cancelled: "bg-gray-100 text-gray-500",
  Completed: "bg-blue-100 text-blue-700",
};

function ReservationsContent() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await reservationsApi.myReservations();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load reservations");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCancel(id: number) {
    if (!confirm("Cancel this reservation?")) return;
    try {
      await reservationsApi.cancel(id);
      setItems((prev) => prev.map((r) => r.id === id ? { ...r, status: "Cancelled" as const } : r));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to cancel");
    }
  }

  function formatDate(d: string) {
    return new Date(d).toLocaleDateString();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Reservations</h1>

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No reservations yet.</p>
          <Link href="/properties" className="text-blue-600 hover:underline mt-2 inline-block">
            Browse properties
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {items.map((r) => (
          <div key={r.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <Link href={`/properties/${r.propertyId}`} className="font-semibold text-blue-600 hover:underline">
                {r.propertyTitle}
              </Link>
              <p className="text-sm text-gray-500 mt-1">
                {formatDate(r.checkIn)} → {formatDate(r.checkOut)}
              </p>
              <p className="text-sm font-medium text-gray-700 mt-1">Total: ${r.totalPrice.toLocaleString()}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[r.status] || ""}`}>
                {r.status}
              </span>
              {r.status === "Confirmed" && (
                <button
                  onClick={() => handleCancel(r.id)}
                  className="text-red-500 hover:text-red-700 text-xs border border-red-300 px-2 py-1 rounded hover:bg-red-50"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function MyReservationsPage() {
  return (
    <AuthGuard>
      <ReservationsContent />
    </AuthGuard>
  );
}
