import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createHash } from "crypto";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg", "image/jpg", "image/png", "image/gif",
  "image/webp", "image/svg+xml",
  "video/mp4", "video/quicktime", "video/webm", "video/x-msvideo",
]);

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("media_library")
    .select("*")
    .eq("user_id", user.id)
    .order("uploaded_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "File is larger than 100MB." }, { status: 413 });
  if (!ALLOWED_MIME_TYPES.has(file.type)) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });

  // --- Deduplication: compute SHA-256 hash of file content ---
  const bytes = await file.arrayBuffer();
  const hash = createHash("sha256").update(Buffer.from(bytes)).digest("hex");

  // Check if this exact file already exists for this user
  const { data: existing } = await supabase
    .from("media_library")
    .select("*")
    .eq("user_id", user.id)
    .eq("content_hash", hash)
    .maybeSingle();

  if (existing) {
    // Return existing item — no duplicate stored
    return NextResponse.json({ item: existing, deduplicated: true });
  }

  const fileType = file.type.startsWith("video/") ? "video" : "image";
  const fileExt = file.name.split(".").pop() || "bin";
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { data: storageData, error: storageError } = await supabase.storage
    .from("media-library")
    .upload(storagePath, bytes, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (storageError) return NextResponse.json({ error: storageError.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage
    .from("media-library")
    .getPublicUrl(storageData.path);

  const { data: mediaItem, error: dbError } = await supabase
    .from("media_library")
    .insert({
      user_id: user.id,
      file_name: file.name,
      file_url: publicUrl,
      file_type: fileType,
      file_size: file.size,
      content_hash: hash,
    })
    .select()
    .single();

  if (dbError) {
    await supabase.storage.from("media-library").remove([storageData.path]);
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ item: mediaItem });
}
