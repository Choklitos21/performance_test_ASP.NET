"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getUser, isLoggedIn, isOwner, logout } from "@/lib/auth";
import type { UserInfo } from "@/lib/auth";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [owner, setOwner] = useState(false);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setUser(getUser());
    setOwner(isOwner());
  }, [pathname]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between flex-wrap gap-y-2">
      <div className="flex items-center gap-6 flex-wrap">
        <Link href="/properties" className="font-bold text-lg">
          RentalApp
        </Link>
        <Link href="/properties" className="hover:underline text-sm">
          Properties
        </Link>
        {loggedIn && !owner && (
          <>
            <Link href="/wishlist" className="hover:underline text-sm">
              Wishlist
            </Link>
            <Link href="/my-reservations" className="hover:underline text-sm">
              My Reservations
            </Link>
            <Link href="/kyc" className="hover:underline text-sm">
              KYC
            </Link>
          </>
        )}
        {loggedIn && (
          <>
            <Link href="/notifications" className="hover:underline text-sm">
              Notifications
            </Link>
            {owner && (
              <>
                <Link href="/owner/properties" className="hover:underline text-sm">
                  My Properties
                </Link>
                <Link href="/owner/dashboard" className="hover:underline text-sm">
                  Dashboard
                </Link>
              </>
            )}
          </>
        )}
      </div>
      <div className="flex items-center gap-4 text-sm">
        {loggedIn ? (
          <>
            <span className="opacity-80">{user?.fullName}</span>
            <button onClick={handleLogout} className="bg-blue-800 px-3 py-1 rounded hover:bg-blue-900">
              Logout
            </button>
          </>
        ) : (
          <>
            <Link href="/login" className="hover:underline">Login</Link>
            <Link href="/register" className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-100">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
