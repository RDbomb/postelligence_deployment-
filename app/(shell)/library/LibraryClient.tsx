"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ImageIcon, Video, Trash2, Eye, Plus, Loader2,
  Upload, X, ExternalLink, Copy, Check, Library
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MediaLibraryItem } from "@/lib/types";

interface Props {
  items: MediaLibraryItem[];
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatSize(bytes: number | null) {
  if (!bytes) return "";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function LibraryClient({ items: initialItems }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<MediaLibraryItem[]>(initialItems);
  const [filter, setFilter] = useState<"all" | "image" | "video">("all");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaLibraryItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Deep-link from the topbar search: "?open=<mediaId>" opens that file's
  // preview modal directly, no matter which tab/page we were on before —
  // this re-runs any time the URL's "open" param changes, not just on
  // first mount, so clicking a different search result while already on
  // this page still opens the new item.
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId) return;
    const match = items.find((i) => i.id === openId);
    if (match) setPreviewItem(match);
  }, [searchParams, items]);

  const closePreview = () => {
    setPreviewItem(null);
    if (searchParams.get("open")) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("open");
      router.replace(params.toString() ? `/library?${params.toString()}` : "/library");
    }
  };

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/media-library", { method: "POST", body: formData });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Upload failed.");
      const { item } = payload;
      setItems((prev) => [item, ...prev]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      showToast("File uploaded to library.");
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Upload failed.", "error");
    } finally {
      setUploading(false);
    }
  };

  const deleteItem = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/media-library/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
      showToast("File deleted.");
    } catch {
      showToast("Failed to delete file.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const copyUrl = (item: MediaLibraryItem) => {
    navigator.clipboard.writeText(item.file_url);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const useInPost = (item: MediaLibraryItem) => {
    // Navigate to create page — the media URL can be pasted in
    window.location.href = `/create?mediaUrl=${encodeURIComponent(item.file_url)}`;
  };

  const filtered = items.filter((i) => filter === "all" || i.file_type === filter);
  const images = items.filter((i) => i.file_type === "image");
  const videos = items.filter((i) => i.file_type === "video");

  return (
    <div className="dashboard-light relative min-h-screen bg-[#f6f7f1] text-[#1f2528]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(43,114,100,0.08),transparent_34%),linear-gradient(315deg,rgba(208,89,69,0.07),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(31,37,40,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(31,37,40,0.045)_1px,transparent_1px)] bg-[size:72px_72px] opacity-50" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#2f7867]/70">Media</p>
            <h1 className="mt-1 text-3xl font-black tracking-[-0.03em] text-[#1f2528]">Content Library</h1>
            <p className="mt-1 text-sm text-slate-500">
              {images.length} image{images.length !== 1 ? "s" : ""} · {videos.length} video{videos.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              onChange={(e) => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }}
            />
            <Button variant="primary" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Upload Media
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-3 gap-4">
          {[
            { label: "Total Files", value: items.length, icon: Library },
            { label: "Images", value: images.length, icon: ImageIcon },
            { label: "Videos", value: videos.length, icon: Video },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-[#1f2528]/10 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eaf3ed]">
                  <Icon className="h-4 w-4 text-[#2f7867]" />
                </div>
                <div>
                  <p className="text-2xl font-black text-[#1f2528]">{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="mb-5 flex gap-1 rounded-xl border border-[#1f2528]/10 bg-white/70 p-1 w-fit shadow-sm backdrop-blur-sm">
          {(["all", "image", "video"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`relative rounded-lg px-4 py-1.5 text-xs font-bold capitalize transition-colors duration-200 ${
                filter === f ? "text-[#1a4a3a]" : "text-slate-500 hover:text-[#1f2528]"
              }`}
            >
              {filter === f && (
                <motion.span
                  layoutId="library-filter-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, rgba(47,120,103,0.20) 0%, rgba(100,190,160,0.25) 50%, rgba(47,120,103,0.16) 100%)",
                    border: "1px solid rgba(47,120,103,0.30)",
                    backdropFilter: "blur(8px)",
                    WebkitBackdropFilter: "blur(8px)",
                  }}
                />
              )}
              <span className="relative z-10">
                {f === "all" ? "All Media" : f === "image" ? "Images" : "Videos"}
              </span>
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#1f2528]/10 bg-white py-20 shadow-sm">
            <ImageIcon className="mb-4 h-12 w-12 text-slate-300" />
            <p className="text-lg font-bold text-slate-500">
              {items.length === 0 ? "No media uploaded yet" : `No ${filter}s in your library`}
            </p>
            <p className="mt-1 text-sm text-slate-400">Upload images and videos to reuse across your posts.</p>
            <Button variant="primary" className="mt-6" onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" /> Upload Your First File
            </Button>
          </div>
        )}

        {/* Grid */}
        {filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <AnimatePresence>
              {filtered.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group relative overflow-hidden rounded-2xl border border-[#1f2528]/10 bg-white shadow-sm transition hover:shadow-[0_8px_32px_rgba(31,37,40,0.12)]"
                >
                  {/* Thumbnail */}
                  <div
                    className="relative h-44 cursor-pointer bg-[#f4f6f0]"
                    onClick={() => setPreviewItem(item)}
                  >
                    {item.file_type === "image" ? (
                      <img src={item.file_url} alt={item.file_name} className="h-full w-full object-cover" />
                    ) : (
                      <video
                        src={item.file_url}
                        className="h-full w-full object-cover"
                        preload="metadata"
                        muted
                      />
                    )}
                    {/* Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/20 group-hover:opacity-100">
                      <Eye className="h-7 w-7 text-white drop-shadow" />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="truncate text-xs font-bold text-[#1f2528]">{item.file_name}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatDate(item.uploaded_at)}{item.file_size ? ` · ${formatSize(item.file_size)}` : ""}
                    </p>

                    {/* Actions */}
                    <div className="mt-3 flex gap-1.5">
                      <button
                        onClick={() => useInPost(item)}
                        className="use-in-post-glass flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[10px] font-bold transition"
                      >
                        <Plus className="h-3 w-3" /> Use in Post
                      </button>
                      <button
                        onClick={() => copyUrl(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#1f2528]/10 bg-white transition hover:bg-[#f4f6f0]"
                        title="Copy URL"
                      >
                        {copiedId === item.id ? <Check className="h-3.5 w-3.5 text-[#2f7867]" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={deletingId === item.id}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-500 transition hover:bg-rose-100 disabled:opacity-50"
                        title="Delete"
                      >
                        {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {previewItem && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center p-4 backdrop-blur-xl"
            style={{ background: "rgba(31,37,40,0.55)" }}
            onClick={() => closePreview()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-[#1f2528]/12 bg-white/92 shadow-[0_32px_80px_rgba(31,37,40,0.22)] backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#1f2528]/10 bg-[#f6f7f1]/60 px-5 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-[#1f2528]">{previewItem.file_name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{previewItem.file_type === "image" ? "Image" : "Video"} · {previewItem.file_size ? `${(previewItem.file_size / 1024).toFixed(0)} KB` : ""}</p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <a
                    href={previewItem.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1f2528]/12 bg-white text-[#46535a] shadow-sm transition hover:bg-[#f2f4ef] hover:text-[#1f2528]"
                    title="Open original"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    onClick={() => closePreview()}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#1f2528]/12 bg-white text-[#46535a] shadow-sm transition hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200"
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Media */}
              <div className="bg-[#f0f2ec] p-3">
                {previewItem.file_type === "image" ? (
                  <img
                    src={previewItem.file_url}
                    alt={previewItem.file_name}
                    className="max-h-[65vh] w-full rounded-xl object-contain shadow-sm"
                  />
                ) : (
                  <video
                    src={previewItem.file_url}
                    controls
                    className="max-h-[65vh] w-full rounded-xl bg-[#1a1f22] shadow-sm"
                  />
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-[#1f2528]/10 bg-[#f6f7f1]/60 px-5 py-3">
                <p className="text-xs text-slate-400">{new Date(previewItem.uploaded_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</p>
                <button
                  onClick={() => { useInPost(previewItem); setPreviewItem(null); }}
                  className="btn-liquid-glass relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold text-[#1a3d34] shadow-[0_4px_16px_rgba(47,120,103,0.18)]"
                >
                  <Plus className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">Use in Post</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 16 }}
            className={`fixed bottom-6 right-6 z-50 rounded-2xl px-5 py-3 text-sm font-bold shadow-lg ${
              toast.type === "error" ? "bg-rose-600 text-white" : "bg-[#1f2528] text-white"
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}