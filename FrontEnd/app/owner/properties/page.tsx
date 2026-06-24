"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";
import { properties as propertiesApi } from "@/services/api";
import type { Property, CreatePropertyDto, UpdatePropertyDto } from "@/types";

function PropertiesContent() {
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Create form state
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pricePerNight, setPricePerNight] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit form state (per-property inline)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");

  // Photo upload state (per-property)
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoError, setPhotoError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await propertiesApi.myProperties();
      setItems(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load properties");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // ── Create ──────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError("");
    try {
      const dto: CreatePropertyDto = {
        title,
        description,
        location,
        pricePerNight: parseFloat(pricePerNight),
      };
      const created = await propertiesApi.create(dto);
      setItems((prev) => [...prev, created]);
      setShowForm(false);
      setTitle(""); setDescription(""); setLocation(""); setPricePerNight("");
    } catch (err: unknown) {
      setCreateError(err instanceof Error ? err.message : "Failed to create property");
    } finally {
      setCreating(false);
    }
  }

  // ── Edit ─────────────────────────────────────────────────────────────
  function startEdit(p: Property) {
    setEditingId(p.id);
    setEditTitle(p.title);
    setEditDescription(p.description);
    setEditLocation(p.location);
    setEditPrice(String(p.pricePerNight));
    setEditIsActive(p.isActive);
    setUpdateError("");
    setUploadingId(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setUpdateError("");
  }

  async function handleUpdate(e: React.FormEvent, id: number) {
    e.preventDefault();
    setUpdating(true);
    setUpdateError("");
    try {
      const dto: UpdatePropertyDto = {
        title: editTitle,
        description: editDescription,
        location: editLocation,
        pricePerNight: parseFloat(editPrice),
        isActive: editIsActive,
      };
      const updated = await propertiesApi.update(id, dto);
      setItems((prev) => prev.map((p) => p.id === id ? updated : p));
      setEditingId(null);
    } catch (err: unknown) {
      setUpdateError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdating(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────
  async function handleDelete(id: number) {
    if (!confirm("Deactivate this property? Existing reservations are not affected.")) return;
    try {
      await propertiesApi.delete(id);
      setItems((prev) => prev.map((p) => p.id === id ? { ...p, isActive: false } : p));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  // ── Photo upload ─────────────────────────────────────────────────────
  function openPhotoUpload(id: number) {
    setUploadingId(id);
    setPhotoFile(null);
    setPhotoError("");
    setEditingId(null);
  }

  async function handlePhotoUpload(e: React.FormEvent, id: number) {
    e.preventDefault();
    if (!photoFile) return;
    setPhotoUploading(true);
    setPhotoError("");
    try {
      const result = await propertiesApi.uploadPhoto(id, photoFile);
      setItems((prev) =>
        prev.map((p) =>
          p.id === id ? { ...p, photoUrls: [...p.photoUrls, result.url] } : p
        )
      );
      setUploadingId(null);
      setPhotoFile(null);
    } catch (err: unknown) {
      setPhotoError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setPhotoUploading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Properties</h1>
        <div className="flex gap-3">
          <Link href="/owner/dashboard" className="text-blue-600 text-sm hover:underline self-center">
            ← Dashboard
          </Link>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
          >
            {showForm ? "Cancel" : "+ Add Property"}
          </button>
        </div>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="font-semibold text-lg mb-4">New Property</h2>
          {createError && (
            <div className="bg-red-50 border border-red-300 text-red-700 rounded px-4 py-2 mb-4 text-sm">
              {createError}
            </div>
          )}
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Beautiful apartment in..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3}
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Describe your property..." />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} required
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="City, Country" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Price per night</label>
              <input type="number" value={pricePerNight} onChange={(e) => setPricePerNight(e.target.value)} required min="1" step="0.01"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="150000" />
            </div>
            <button type="submit" disabled={creating}
              className="bg-blue-600 text-white rounded py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
              {creating ? "Creating…" : "Create Property"}
            </button>
          </form>
        </div>
      )}

      {loading && <p className="text-gray-500 text-center py-12">Loading…</p>}
      {error && <p className="text-red-600 text-center py-4">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>No properties yet.</p>
          <button onClick={() => setShowForm(true)} className="text-blue-600 hover:underline mt-2 inline-block">
            Add your first property
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow overflow-hidden">
            {/* Property card header */}
            <div className="p-4 flex justify-between items-start gap-3">
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="bg-blue-100 w-16 h-16 rounded flex-shrink-0 flex items-center justify-center text-2xl text-blue-300 overflow-hidden">
                  {p.photoUrls && p.photoUrls.length > 0 ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.photoUrls[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : "🏠"}
                </div>
                <div className="min-w-0">
                  <Link href={`/properties/${p.id}`} className="font-semibold text-blue-600 hover:underline">
                    {p.title}
                  </Link>
                  <p className="text-sm text-gray-500">{p.location}</p>
                  <p className="text-sm font-medium text-gray-700 mt-0.5">${p.pricePerNight.toLocaleString()} / night</p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-1.5 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full font-medium self-center ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.isActive ? "Active" : "Inactive"}
                </span>
                <Link href={`/owner/properties/${p.id}/reservations`}
                  className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded hover:bg-blue-100">
                  Reservations
                </Link>
                <button
                  onClick={() => editingId === p.id ? cancelEdit() : startEdit(p)}
                  className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100">
                  {editingId === p.id ? "Cancel" : "Edit"}
                </button>
                <button
                  onClick={() => uploadingId === p.id ? setUploadingId(null) : openPhotoUpload(p.id)}
                  className="text-xs bg-gray-50 text-gray-700 border border-gray-200 px-2 py-1 rounded hover:bg-gray-100">
                  {uploadingId === p.id ? "Cancel" : "Photo"}
                </button>
                {p.isActive && (
                  <button onClick={() => handleDelete(p.id)}
                    className="text-xs text-red-500 border border-red-300 px-2 py-1 rounded hover:bg-red-50">
                    Delete
                  </button>
                )}
              </div>
            </div>

            {/* Edit form (inline) */}
            {editingId === p.id && (
              <div className="border-t px-4 py-4 bg-gray-50">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Edit Property</h3>
                {updateError && (
                  <div className="bg-red-50 border border-red-300 text-red-700 rounded px-3 py-2 mb-3 text-sm">
                    {updateError}
                  </div>
                )}
                <form onSubmit={(e) => handleUpdate(e, p.id)} className="flex flex-col gap-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium mb-1">Title</label>
                      <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium mb-1">Location</label>
                      <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} required
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Description</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} required rows={2}
                      className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                  </div>
                  <div className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-xs font-medium mb-1">Price per night</label>
                      <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} required min="1" step="0.01"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400" />
                    </div>
                    <label className="flex items-center gap-2 text-sm pb-2 cursor-pointer">
                      <input type="checkbox" checked={editIsActive} onChange={(e) => setEditIsActive(e.target.checked)} className="rounded" />
                      Active
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={updating}
                      className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                      {updating ? "Saving…" : "Save Changes"}
                    </button>
                    <button type="button" onClick={cancelEdit}
                      className="bg-slate-200 text-slate-800 px-4 py-2 rounded text-sm font-medium hover:bg-slate-300">
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Photo upload (inline) */}
            {uploadingId === p.id && (
              <div className="border-t px-4 py-4 bg-gray-50">
                <h3 className="text-sm font-semibold mb-3 text-gray-700">Upload Photo</h3>
                <form onSubmit={(e) => handlePhotoUpload(e, p.id)} className="flex flex-wrap gap-3 items-center">
                  <input type="file" accept="image/*"
                    onChange={(e) => { setPhotoFile(e.target.files?.[0] || null); setPhotoError(""); }}
                    className="text-sm text-gray-900 border border-gray-300 rounded px-3 py-1.5 bg-white file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                  <button type="submit" disabled={!photoFile || photoUploading}
                    className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                    {photoUploading ? "Uploading…" : "Upload"}
                  </button>
                </form>
                {photoError && <p className="mt-2 text-sm text-red-600">{photoError}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OwnerPropertiesPage() {
  return (
    <AuthGuard ownerOnly>
      <PropertiesContent />
    </AuthGuard>
  );
}
