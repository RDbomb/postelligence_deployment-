import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const linkedInHeaders = {
  "LinkedIn-Version": process.env.LINKEDIN_API_VERSION || "202605",
  "X-Restli-Protocol-Version": "2.0.0",
};

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const mediaUrl = formData.get("mediaUrl") as string;
  const mediaType = formData.get("mediaType") as string;
  const workspaceId = formData.get("workspaceId") as string | null;

  // A Team draft publishes through the workspace's own LinkedIn account,
  // never whichever member happens to be scheduling it.
  const accountQuery = workspaceId
    ? supabase.from("social_accounts").select("access_token, account_id")
        .eq("workspace_id", workspaceId).eq("platform", "linkedin").eq("status", "connected").single()
    : supabase.from("social_accounts").select("access_token, account_id")
        .eq("user_id", user.id).is("workspace_id", null).eq("platform", "linkedin").eq("status", "connected").single();

  const { data: account } = await accountQuery;

  if (!account?.access_token) {
    return NextResponse.json({ error: workspaceId ? "The workspace has no connected LinkedIn account." : "LinkedIn not connected" }, { status: 400 });
  }

  if (!mediaUrl) return NextResponse.json({ error: "No media URL provided" }, { status: 400 });

  const token = account.access_token;
  const author = `urn:li:person:${account.account_id}`;
  const isVideo = mediaType === "video" || /\.(mp4|mov|webm|avi)(\?|$)/i.test(mediaUrl);

  try {
    // Fetch the media file
    const mediaRes = await fetch(mediaUrl);
    if (!mediaRes.ok) throw new Error("Could not fetch media from storage");
    const mediaBuffer = await mediaRes.arrayBuffer();
    const contentType = mediaRes.headers.get("content-type") || (isVideo ? "video/mp4" : "image/jpeg");

    if (isVideo) {
      const fileSizeBytes = mediaBuffer.byteLength;

      // Initialize video upload
      const initRes = await fetch("https://api.linkedin.com/rest/videos?action=initializeUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...linkedInHeaders,
        },
        body: JSON.stringify({
          initializeUploadRequest: {
            owner: author,
            fileSizeBytes,
            uploadCaptions: false,
            uploadThumbnail: false,
          },
        }),
      });

      if (!initRes.ok) {
        const err = await initRes.text();
        throw new Error(`Video init failed: ${err}`);
      }

      const initData = await initRes.json();
      const videoUrn: string = initData?.value?.video;
      const uploadInstructions: Array<{ uploadUrl: string; firstByte: number; lastByte: number }> =
        initData?.value?.uploadInstructions ?? [];
      const uploadToken: string = initData?.value?.uploadToken;

      if (!videoUrn || !uploadInstructions.length) {
        throw new Error("LinkedIn video init did not return upload instructions");
      }

      // Upload chunks
      const bytes = Buffer.from(mediaBuffer);
      const eTags: string[] = [];
      for (const instruction of uploadInstructions) {
        const chunk = bytes.slice(instruction.firstByte, instruction.lastByte + 1);
        const chunkRes = await fetch(instruction.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": "application/octet-stream" },
          body: chunk,
        });
        if (!chunkRes.ok) throw new Error(`Chunk upload failed: ${chunkRes.status}`);
        const eTag = chunkRes.headers.get("ETag") || chunkRes.headers.get("etag") || "";
        eTags.push(eTag);
      }

      // Finalize
      const finalizeRes = await fetch("https://api.linkedin.com/rest/videos?action=finalizeUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...linkedInHeaders,
        },
        body: JSON.stringify({
          finalizeUploadRequest: {
            video: videoUrn,
            uploadToken,
            uploadedPartIds: eTags,
          },
        }),
      });

      if (!finalizeRes.ok) {
        const err = await finalizeRes.text();
        throw new Error(`Video finalize failed: ${err}`);
      }

      return NextResponse.json({ urn: videoUrn, type: "video" });

    } else {
      // Image upload
      const initRes = await fetch("https://api.linkedin.com/rest/images?action=initializeUpload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          ...linkedInHeaders,
        },
        body: JSON.stringify({ initializeUploadRequest: { owner: author } }),
      });

      if (!initRes.ok) {
        const err = await initRes.text();
        throw new Error(`Image init failed: ${err}`);
      }

      const initData = await initRes.json();
      const uploadUrl: string = initData?.value?.uploadUrl;
      const imageUrn: string = initData?.value?.image;

      if (!uploadUrl || !imageUrn) throw new Error("LinkedIn image init did not return upload URL");

      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": contentType,
        },
        body: mediaBuffer,
      });

      if (!putRes.ok) throw new Error(`Image PUT failed: ${putRes.status}`);

      return NextResponse.json({ urn: imageUrn, type: "image" });
    }

  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Pre-upload failed" },
      { status: 500 }
    );
  }
}