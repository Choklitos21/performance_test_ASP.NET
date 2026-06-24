"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { wishlist as wishlistApi } from "@/services/api";
import type { WishlistItem } from "@/types";

function WishlistContent() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await wishlistApi.list();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load wishlist");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleRemove(propertyId: number) {
    try {
      await wishlistApi.remove(propertyId);
      setItems((prev) => prev.filter((i) => i.propertyId !== propertyId));
    } catch {
      alert("Failed to remove from wishlist");
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Wishlist</h1>

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Your wishlist is empty.</p>
          <Link href="/properties" className="text-blue-600 hover:underline mt-2 inline-block">
            Browse properties
          </Link>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow p-4 flex justify-between items-center">
            <div>
              <Link href={`/properties/${item.propertyId}`} className="font-semibold text-blue-600 hover:underline">
                {item.propertyTitle}
              </Link>
              <p className="text-sm text-gray-500">{item.location}</p>
              <p className="text-sm font-medium text-gray-700 mt-1">${item.pricePerNight.toLocaleString()} / night</p>
            </div>
            <button
              onClick={() => handleRemove(item.propertyId)}
              className="text-red-500 hover:text-red-700 text-sm border border-red-300 px-3 py-1 rounded hover:bg-red-50"
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function WishlistPage() {
  return (
    <AuthGuard>
      <WishlistContent />
    </AuthGuard>
  );
}
