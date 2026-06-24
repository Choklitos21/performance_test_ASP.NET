"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isLoggedIn, isOwner } from "@/lib/auth";

interface Props {
  children: React.ReactNode;
  ownerOnly?: boolean;
}

export default function AuthGuard({ children, ownerOnly = false }: Props) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace("/login");
      return;
    }
    if (ownerOnly && !isOwner()) {
      router.replace("/properties");
      return;
    }
    setReady(true);
  }, [router, ownerOnly]);

  if (!ready) return <div className="p-8 text-center text-gray-500">Loading…</div>;
  return <>{children}</>;
}
