"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { properties as propertiesApi } from "@/services/api";
import type { Property } from "@/types";

export default function PropertiesPage() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [location, setLocation] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  async function fetchProperties() {
    setLoading(true);
    setError("");
    try {
      const params: { location?: string; checkIn?: string; checkOut?: string } = {};
      if (location) params.location = location;
      if (checkIn && checkOut) {
        params.checkIn = checkIn;
        params.checkOut = checkOut;
      }
      const data = await propertiesApi.list(params);
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProperties();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    fetchProperties();
  }

  function handleClear() {
    setLocation("");
    setCheckIn("");
    setCheckOut("");
    propertiesApi.list().then(setItems).catch(() => {});
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Available Properties</h1>

      <form onSubmit={handleSearch} className="bg-white rounded-lg shadow p-4 mb-6 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
          <label className="text-sm font-medium">City / Location</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bogotá"
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Check-in</label>
          <input
            type="date"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Check-out</label>
          <input
            type="date"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700">
          Search
        </button>
        <button type="button" onClick={handleClear} className="bg-slate-200 text-slate-800 px-4 py-2 rounded text-sm font-medium hover:bg-slate-300">
          Clear
        </button>
      </form>

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <p className="text-gray-500 text-center py-12">No properties found.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((p) => (
          <Link
            key={p.id}
            href={`/properties/${p.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="bg-blue-100 h-40 flex items-center justify-center text-blue-400 text-4xl">
              {p.photoUrls && p.photoUrls.length > 0 ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.photoUrls[0]} alt={p.title} className="w-full h-full object-cover" />
              ) : (
                "🏠"
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-gray-900 truncate">{p.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{p.location}</p>
              <p className="text-blue-600 font-bold mt-2">${p.pricePerNight.toLocaleString()} <span className="text-gray-400 font-normal text-sm">/ night</span></p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
