"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Save, Upload, RotateCcw, X, Crop } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";

const ALL_PLATFORMS = [
  { id: "instagram",  label: "Instagram",  color: "#E1306C" },
  { id: "facebook",   label: "Facebook",   color: "#1877F2" },
  { id: "linkedin",   label: "LinkedIn",   color: "#0A66C2" },
  { id: "youtube",    label: "YouTube",    color: "#FF0033" },
  { id: "threads",    label: "Threads",    color: "#111827" },
  { id: "bluesky",    label: "Bluesky",    color: "#1185FE" },
  { id: "pinterest",  label: "Pinterest",  color: "#E60023" },
];

const DEFAULT_AVATARS = [
  { id: "avatar-1", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" },
  { id: "avatar-2", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" },
  { id: "avatar-3", url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Milo" },
  { id: "avatar-4", url: "https://api.dicebear.com/7.x/bottts/svg?seed=SyncBot" },
  { id: "avatar-5", url: "https://api.dicebear.com/7.x/lorelei/svg?seed=Creator" },
  { id: "avatar-6", url: "https://api.dicebear.com/7.x/identicon/svg?seed=Post" },
];

const COUNTRIES = [
  { code: "+91", country: "IN", label: "India (+91)", digits: 10 },
  { code: "+1",  country: "US", label: "United States (+1)", digits: 10 },
  { code: "+44", country: "UK", label: "United Kingdom (+44)", digits: 10 },
  { code: "+971", country: "AE", label: "United Arab Emirates (+971)", digits: 9 },
  { code: "+61", country: "AU", label: "Australia (+61)", digits: 9 },
  { code: "+81", country: "JP", label: "Japan (+81)", digits: 10 },
];

interface Props {
  initialDefaultPlatforms: string[];
  initialUser: any;
}

export default function SettingsClient({ initialDefaultPlatforms, initialUser }: Props) {
  const router = useRouter();
  
  // Platform settings
  const [defaultPlatforms, setDefaultPlatforms] = useState<string[]>(initialDefaultPlatforms);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile details
  const [fullName, setFullName] = useState(initialUser?.user_metadata?.full_name || initialUser?.user_metadata?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(initialUser?.user_metadata?.avatar_url || "");
  const [uploading, setUploading] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Phone states
  const [countryCode, setCountryCode] = useState(initialUser?.user_metadata?.phone_country_code || "+91");
  const [phone, setPhone] = useState(initialUser?.user_metadata?.phone_number || "");

  // Detect if user has a Google picture
  const googlePhoto = initialUser?.user_metadata?.picture || 
    (initialUser?.user_metadata?.avatar_url?.includes("googleusercontent.com") ? initialUser?.user_metadata?.avatar_url : null);

  const defaultAvatars = [
    ...(googlePhoto ? [{ id: "google-avatar", url: googlePhoto, isGoogle: true }] : []),
    ...DEFAULT_AVATARS,
  ];

  // Cropper states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [cropScale, setCropScale] = useState(1);
  const [cropPosition, setCropPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const avatarInputRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) => {
    setDefaultPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
    setSaved(false);
  };

  const saveDefaultPlatforms = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/user-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ default_platforms: defaultPlatforms }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    setUploading(true);
    setProfileError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const res = await fetch("/api/media-library", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setAvatarUrl(data.item.file_url);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    try {
      const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
      const cleanedPhone = phone.replace(/\D/g, "");

      if (phone && selectedCountry && cleanedPhone.length !== selectedCountry.digits) {
        throw new Error(
          `Phone number for ${selectedCountry.label} must be exactly ${selectedCountry.digits} digits (you have ${cleanedPhone.length}).`
        );
      }

      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: fullName,
          name: fullName,
          avatar_url: avatarUrl,
          phone_country_code: countryCode,
          phone_number: cleanedPhone,
        },
      });
      if (updateError) throw updateError;
      setProfileSaved(true);
      router.refresh();
      setTimeout(() => setProfileSaved(false), 3000);
    } catch (e) {
      setProfileError(e instanceof Error ? e.message : "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Image load & setup for Cropping Modal
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setCropScale(1);
      setCropPosition({ x: 0, y: 0 });
    };
    reader.readAsDataURL(file);
  };

  // Custom canvas-based cropping execution
  const cropImage = () => {
    if (!imageSrc) return;

    const imgElement = new Image();
    imgElement.src = imageSrc;
    imgElement.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 250;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const viewSize = 288; // size of the container box
      const cropSize = 176; // size of the circle viewport

      // Scale ratio of the image render dimensions
      const aspect = imgElement.width / imgElement.height;
      let displayedWidth = viewSize;
      let displayedHeight = viewSize;
      
      if (aspect > 1) {
        displayedWidth = viewSize * aspect;
      } else {
        displayedHeight = viewSize / aspect;
      }

      // Calculate width and height in actual image pixels to crop
      const sw = (cropSize / cropScale) * (imgElement.width / displayedWidth);
      const sh = (cropSize / cropScale) * (imgElement.height / displayedHeight);

      // Translate offsets from screen pixels to raw image pixels
      const sx = (imgElement.width / 2) - (sw / 2) - (cropPosition.x * (imgElement.width / (displayedWidth * cropScale)));
      const sy = (imgElement.height / 2) - (sh / 2) - (cropPosition.y * (imgElement.height / (displayedHeight * cropScale)));

      ctx.drawImage(imgElement, sx, sy, sw, sh, 0, 0, size, size);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], "avatar.jpg", { type: "image/jpeg" });
        await handleAvatarUpload(croppedFile);
        setImageSrc(null); // close cropper
      }, "image/jpeg", 0.95);
    };
  };

  // Drag handlers for cropping image position adjust
  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropPosition.x, y: e.clientY - cropPosition.y });
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setCropPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-[#1f2528]">Settings</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your profile and platform preferences</p>
      </div>

      {/* Profile Details Card */}
      <div className="rounded-lg border border-[#1f2528]/10 bg-white p-6 shadow-[0_8px_32px_rgba(31,37,40,0.08)]">
        <div className="mb-1 text-sm font-black text-[#1f2528]">Profile Details</div>
        <p className="mb-4 text-xs text-slate-400">
          Update your creator credentials, name, and profile avatar.
        </p>

        <div className="space-y-5">
          {/* Avatar Area */}
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={fullName}
                  className="h-24 w-24 rounded-full object-cover border border-[#1f2528]/12 shadow-sm"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2f7867]/10 text-2xl font-bold text-[#2f7867] border border-[#2f7867]/20">
                  {(fullName || "CR").slice(0, 2).toUpperCase()}
                </div>
              )}
              <input
                ref={avatarInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={onFileChange}
              />
            </div>
            
            <div className="flex-1 flex flex-col gap-3 w-full text-left">
              <div>
                <span className="text-xs font-bold text-slate-500">Select Default Avatar</span>
                {/* Horizontal row of default avatars */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {defaultAvatars.map((av: any) => {
                    const isSelected = avatarUrl === av.url;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarUrl(av.url)}
                        className={cn(
                          "h-10 w-10 rounded-full overflow-hidden border-2 transition-all cursor-pointer relative",
                          isSelected ? "border-[#2f7867] scale-110 shadow-sm" : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                        )}
                        title={av.isGoogle ? "Google Account Photo" : "Default Avatar"}
                      >
                        <img src={av.url} alt="avatar option" className="h-full w-full object-cover" />
                        {av.isGoogle && (
                          <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-sm border border-slate-100 flex items-center justify-center">
                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Upload & Reset */}
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  variant="secondary"
                  className="h-9.5 text-xs font-bold"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                  Upload Custom
                </Button>
                {avatarUrl && (
                  <Button
                    variant="outline"
                    className="h-9.5 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 cursor-pointer"
                    onClick={() => setAvatarUrl("")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset to Default
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Full Name */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-500">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="rounded-lg border border-[#1f2528]/10 bg-slate-50 px-3 py-2.5 text-xs text-[#1f2528] focus:border-[#2f7867] focus:outline-none font-semibold"
              placeholder="Your full name"
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-500">Phone Number</label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => {
                  const newCode = e.target.value;
                  setCountryCode(newCode);
                  const selectedCountry = COUNTRIES.find((c) => c.code === newCode);
                  if (selectedCountry) {
                    setPhone((prev: string) => prev.replace(/\D/g, "").slice(0, selectedCountry.digits));
                  }
                }}
                className="rounded-lg border border-[#1f2528]/10 bg-slate-50 px-2.5 py-2.5 text-xs text-[#1f2528] focus:border-[#2f7867] focus:outline-none font-semibold cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  const selectedCountry = COUNTRIES.find((c) => c.code === countryCode);
                  const limit = selectedCountry ? selectedCountry.digits : 15;
                  setPhone(val.slice(0, limit));
                }}
                className="flex-1 rounded-lg border border-[#1f2528]/10 bg-slate-50 px-3 py-2.5 text-xs text-[#1f2528] focus:border-[#2f7867] focus:outline-none font-semibold"
                placeholder="Phone number..."
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-500">Email Address (Primary)</label>
            <input
              type="text"
              value={initialUser?.email || ""}
              disabled
              className="rounded-lg border border-[#1f2528]/10 bg-slate-100 px-3 py-2.5 text-xs text-slate-400 cursor-not-allowed outline-none"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" disabled={savingProfile} onClick={saveProfile}>
            {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {savingProfile ? "Saving Profile..." : "Save Profile"}
          </Button>
          {profileSaved && (
            <span className="flex items-center gap-1.5 text-sm font-bold text-[#2f7867]">
              <Check className="h-4 w-4" /> Profile saved!
            </span>
          )}
          {profileError && <span className="text-sm font-bold text-rose-500">{profileError}</span>}
        </div>
      </div>

      {/* ── CUSTOM CANVAS IMAGE CROPPER MODAL ── */}
      <AnimatePresence>
        {imageSrc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-[#1f2528]/10 bg-white p-5 text-center shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="text-sm font-black text-[#1f2528]">Position & Crop Avatar</span>
                <button
                  onClick={() => setImageSrc(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-[#1f2528] cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Viewport Box (288x288px) */}
              <div
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={() => setIsDragging(false)}
                onMouseLeave={() => setIsDragging(false)}
                className="w-72 h-72 mx-auto bg-slate-950 overflow-hidden relative cursor-grab active:cursor-grabbing rounded-2xl flex items-center justify-center"
              >
                {/* Circular Mask Frame overlay */}
                <div className="absolute w-44 h-44 rounded-full border-2 border-white pointer-events-none z-10 shadow-[0_0_0_9999px_rgba(15,23,42,0.65)]" />

                {/* Raw Image display */}
                <img
                  src={imageSrc}
                  alt="crop target"
                  draggable={false}
                  className="max-w-none origin-center pointer-events-none select-none transition-transform duration-75 ease-out"
                  style={{
                    transform: `translate(${cropPosition.x}px, ${cropPosition.y}px) scale(${cropScale})`,
                  }}
                />
              </div>

              {/* Zoom Control Slider */}
              <div className="mt-4 flex flex-col gap-1 text-left px-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Scale / Zoom</span>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="0.02"
                  value={cropScale}
                  onChange={(e) => setCropScale(parseFloat(e.target.value))}
                  className="w-full accent-[#2f7867] cursor-pointer"
                />
              </div>

              {/* Crop Modal Actions */}
              <div className="mt-6 flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button variant="outline" className="h-9.5 text-xs" onClick={() => setImageSrc(null)}>
                  Cancel
                </Button>
                <Button variant="primary" className="h-9.5 text-xs" onClick={cropImage} disabled={uploading}>
                  {uploading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Crop className="h-4 w-4" />}
                  Crop & Save
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Default Channels Card */}
      <div className="rounded-lg border border-[#1f2528]/10 bg-white p-6 shadow-[0_8px_32px_rgba(31,37,40,0.08)]">
        <div className="mb-1 text-sm font-black text-[#1f2528]">Default channels</div>
        <p className="mb-4 text-xs text-slate-400">
          These platforms will be pre-selected every time you open the Create page.
        </p>

        <div className="flex flex-wrap gap-2">
          {ALL_PLATFORMS.map((p) => {
            const selected = defaultPlatforms.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-bold transition",
                  selected
                    ? "border-transparent text-white"
                    : "border-[#1f2528]/10 bg-[#f9faf7] text-slate-500 hover:bg-[#f2f4ef] hover:text-[#1f2528]"
                )}
                style={selected ? { backgroundColor: p.color, borderColor: p.color } : undefined}
              >
                {selected && <Check className="h-3.5 w-3.5" />}
                {p.label}
              </button>
            );
          })}
        </div>

        {defaultPlatforms.length === 0 && (
          <p className="mt-3 text-xs text-amber-500">
            No default channels selected — the Create page will start with no platforms pre-selected.
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <Button variant="primary" disabled={saving} onClick={saveDefaultPlatforms}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-bold text-[#2f7867]">
              <Check className="h-4 w-4" /> Preferences saved!
            </span>
          )}
          {error && <span className="text-sm font-bold text-rose-500">{error}</span>}
        </div>
      </div>
    </div>
  );
}