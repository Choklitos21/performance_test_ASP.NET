"use client";

import { useEffect, useState } from "react";
import AuthGuard from "@/components/AuthGuard";
import { notifications as notificationsApi } from "@/services/api";
import type { Notification } from "@/types";

function NotificationsContent() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    notificationsApi.list()
      .then(setItems)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: number) {
    try {
      await notificationsApi.markRead(id);
      setItems((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    const unread = items.filter((n) => !n.isRead);
    await Promise.allSettled(unread.map((n) => notificationsApi.markRead(n.id)));
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = items.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Notifications
          {unreadCount > 0 && (
            <span className="ml-2 text-sm bg-blue-600 text-white rounded-full px-2 py-0.5">
              {unreadCount}
            </span>
          )}
        </h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-sm text-blue-600 hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p className="text-4xl mb-3">🔔</p>
          <p>No notifications yet.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {items.map((n) => (
          <div
            key={n.id}
            className={`rounded-lg border px-4 py-4 flex justify-between items-start gap-3 transition-colors ${
              n.isRead ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1">
                {!n.isRead && (
                  <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
                <p className="font-semibold text-sm text-gray-900">{n.title}</p>
              </div>
              <p className="text-sm text-gray-600">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(n.createdAt).toLocaleString()}
              </p>
            </div>
            {!n.isRead && (
              <button
                onClick={() => markRead(n.id)}
                className="text-xs text-blue-600 border border-blue-300 px-2 py-1 rounded hover:bg-blue-100 flex-shrink-0 whitespace-nowrap"
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  return (
    <AuthGuard>
      <NotificationsContent />
    </AuthGuard>
  );
}
