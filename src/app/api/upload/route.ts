import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  MAX_VEHICLE_IMAGES,
  MAX_IMAGE_SIZE_MB,
  ALLOWED_IMAGE_TYPES,
} from "@/constants";

const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const ALLOWED_BUCKETS = ["vehicle-images", "kyc-documents"];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const bucketParam = formData.get("bucket") as string || "vehicle-images";
    const folder = user.id; // Always use user ID as folder, ignore user input

    // Validate bucket against whitelist
    const bucket = ALLOWED_BUCKETS.includes(bucketParam) ? bucketParam : "vehicle-images";

    // Get all files from form data
    const files: File[] = [];
    let i = 0;
    while (true) {
      const file = formData.get(`file-${i}`) as File | null;
      if (!file) break;
      files.push(file);
      i++;
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files provided" },
        { status: 400 }
      );
    }

    if (files.length > MAX_VEHICLE_IMAGES) {
      return NextResponse.json(
        { error: `Maximum ${MAX_VEHICLE_IMAGES} files allowed` },
        { status: 400 }
      );
    }

    // Upload files
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];

      // Validate file size
      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        errors.push(`File ${index}: exceeds ${MAX_IMAGE_SIZE_MB}MB limit`);
        continue;
      }

      // Validate MIME type
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        errors.push(`File ${index}: invalid file type ${file.type}`);
        continue;
      }

      // Validate extension
      const fileExt = file.name.split(".").pop()?.toLowerCase();
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        errors.push(`File ${index}: invalid file extension`);
        continue;
      }

      const fileName = `${folder}/${index}-${Date.now()}.${fileExt}`;

      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, buffer, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error(`Error uploading file ${index}:`, error);
        errors.push(`File ${index}: ${error.message}`);
        continue;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(data.path);

      uploadedUrls.push(publicUrl);
    }

    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        { error: "Failed to upload any files", details: errors },
        { status: 500 }
      );
    }

    return NextResponse.json({
      urls: uploadedUrls,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove files
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { paths, bucket = "vehicle-images" } = await request.json();

    if (!paths || !Array.isArray(paths) || paths.length === 0) {
      return NextResponse.json(
        { error: "No paths provided" },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage.from(bucket).remove(paths);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
