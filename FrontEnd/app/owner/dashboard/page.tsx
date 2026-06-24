"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { dashboard as dashboardApi, reports } from "@/services/api";
import type { DashboardData } from "@/types";

function DashboardContent() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    dashboardApi
      .get()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  async function handleExport() {
    setDownloading(true);
    try {
      await reports.downloadExcel();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Export failed");
    } finally {
      setDownloading(false);
    }
  }

  if (loading) return <p className="p-8 text-center text-gray-500">Loading…</p>;
  if (error) return <p className="p-8 text-center text-red-500">{error}</p>;
  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Owner Dashboard</h1>
        <div className="flex gap-3">
          <Link
            href="/owner/properties"
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            My Properties
          </Link>
          <button
            onClick={handleExport}
            disabled={downloading}
            className="bg-green-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-green-700 disabled:opacity-50"
          >
            {downloading ? "Exporting…" : "Export Excel"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Properties</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalProperties}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Reservations</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{data.totalReservations}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-1">${data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-5">
          <p className="text-sm text-gray-500">Avg. Occupancy Rate</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{data.occupancyRate.toFixed(1)}%</p>
        </div>
      </div>

      <h2 className="font-semibold text-lg mb-4">Properties Breakdown</h2>
      {data.propertyMetrics && data.propertyMetrics.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Property</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Reservations</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Revenue</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Occupancy</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.propertyMetrics.map((p) => (
                <tr key={p.propertyId} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{p.title}</td>
                  <td className="px-4 py-3 text-right">{p.reservationCount}</td>
                  <td className="px-4 py-3 text-right text-green-600">${p.revenue.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-blue-600">{p.occupancyRate.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">No property data available.</p>
      )}
    </div>
  );
}

export default function OwnerDashboardPage() {
  return (
    <AuthGuard ownerOnly>
      <DashboardContent />
    </AuthGuard>
  );
}
