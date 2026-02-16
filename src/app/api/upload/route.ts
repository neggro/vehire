import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
    const bucket = formData.get("bucket") as string || "vehicle-images";
    const folder = formData.get("folder") as string || user.id;

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

    // Upload files
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let index = 0; index < files.length; index++) {
      const file = files[index];
      const fileExt = file.name.split(".").pop();
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
