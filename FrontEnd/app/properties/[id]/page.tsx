"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { properties as propertiesApi, reservations as reservationsApi, wishlist as wishlistApi } from "@/services/api";
import { isLoggedIn, isOwner } from "@/lib/auth";
import type { Property } from "@/types";

export default function PropertyDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const propertyId = Number(id);

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reserving, setReserving] = useState(false);
  const [reserveMsg, setReserveMsg] = useState("");
  const [reserveError, setReserveError] = useState("");

  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistMsg, setWishlistMsg] = useState("");

  // Use state for auth to avoid SSR/client hydration mismatch
  const [loggedIn, setLoggedIn] = useState(false);
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setOwner(isOwner());
  }, []);

  useEffect(() => {
    propertiesApi
      .get(propertyId)
      .then(setProperty)
      .catch(() => setError("Property not found"))
      .finally(() => setLoading(false));
  }, [propertyId]);

  async function handleReserve(e: React.FormEvent) {
    e.preventDefault();
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setReserving(true);
    setReserveMsg("");
    setReserveError("");
    try {
      await reservationsApi.create({ propertyId, checkInDate: checkIn, checkOutDate: checkOut });
      setReserveMsg("Reservation confirmed!");
      setCheckIn("");
      setCheckOut("");
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 403) {
        setReserveError("KYC verification required. Please verify your identity first.");
      } else if (e.status === 409 || e.status === 400) {
        setReserveError("These dates are not available. Please choose different dates.");
      } else {
        setReserveError(e.message || "Failed to create reservation");
      }
    } finally {
      setReserving(false);
    }
  }

  async function handleWishlist() {
    if (!loggedIn) {
      router.push("/login");
      return;
    }
    setWishlistLoading(true);
    setWishlistMsg("");
    try {
      await wishlistApi.add(propertyId);
      setWishlistMsg("Added to wishlist!");
    } catch {
      setWishlistMsg("Could not add to wishlist");
    } finally {
      setWishlistLoading(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-gray-500">Loading…</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!property) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <button onClick={() => router.back()} className="text-blue-600 text-sm hover:underline mb-4 flex items-center gap-1">
        ← Back
      </button>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-blue-100 h-56 flex items-center justify-center text-6xl text-blue-300">
          {property.photoUrls && property.photoUrls.length > 0 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={property.photoUrls[0]} alt={property.title} className="w-full h-full object-cover" />
          ) : (
            "🏠"
          )}
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{property.title}</h1>
              <p className="text-gray-500 mt-1">{property.location}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">${property.pricePerNight.toLocaleString()}</p>
              <p className="text-sm text-gray-400">/ night</p>
            </div>
          </div>

          <p className="mt-4 text-gray-700">{property.description}</p>

          {!owner && (
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleWishlist}
                disabled={wishlistLoading}
                className="flex items-center gap-1 border border-blue-600 text-blue-600 px-4 py-2 rounded text-sm hover:bg-blue-50 disabled:opacity-50"
              >
                ♡ Save to Wishlist
              </button>
              {wishlistMsg && <span className="text-sm text-gray-500 self-center">{wishlistMsg}</span>}
            </div>
          )}

          <hr className="my-6" />

          {owner ? (
            <p className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded px-4 py-3">
              Owner accounts cannot make reservations. To book a property, please use a Guest account.
            </p>
          ) : (
            <>
              <h2 className="font-semibold text-lg mb-4">Make a Reservation</h2>

              {!loggedIn && (
                <p className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded px-4 py-2 mb-4">
                  Please <a href="/login" className="text-blue-600 hover:underline">login</a> to make a reservation.
                </p>
              )}

              {reserveMsg && (
                <div className="bg-green-50 border border-green-300 text-green-700 rounded px-4 py-2 mb-4 text-sm">
                  {reserveMsg}
                </div>
              )}
              {reserveError && (
                <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">
                  {reserveError}
                  {reserveError.includes("KYC") && (
                    <> <a href="/kyc" className="underline font-medium ml-1">Go to KYC</a></>
                  )}
                </div>
              )}

              <form onSubmit={handleReserve} className="flex flex-wrap gap-4 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    required
                    className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    required
                    className="border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  />
                </div>
                <button
                  type="submit"
                  disabled={reserving}
                  className="bg-blue-600 text-white px-6 py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {reserving ? "Booking…" : "Reserve"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
