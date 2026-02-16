import { createClient } from "./supabase/client";

const BUCKET_NAME = "vehicle-images";

export interface UploadResult {
  url: string;
  path: string;
  error?: string;
}

export async function uploadVehicleImage(
  file: File,
  vehicleId: string,
  index: number
): Promise<UploadResult> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${vehicleId}/${index}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { url: "", path: "", error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
}

export async function uploadMultipleImages(
  files: File[],
  vehicleId: string
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (let i = 0; i < files.length; i++) {
    const result = await uploadVehicleImage(files[i], vehicleId, i);
    results.push(result);
  }

  return results;
}

export async function deleteVehicleImage(path: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  return !error;
}

export async function deleteVehicleImages(vehicleId: string): Promise<boolean> {
  const supabase = createClient();

  // List all files in the vehicle's folder
  const { data: files, error: listError } = await supabase.storage
    .from(BUCKET_NAME)
    .list(vehicleId);

  if (listError || !files) {
    return false;
  }

  // Delete all files
  const paths = files.map((file) => `${vehicleId}/${file.name}`);
  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths);

  return !deleteError;
}

// For KYC documents
const KYC_BUCKET_NAME = "kyc-documents";

export async function uploadKYCDocument(
  file: File,
  userId: string,
  documentType: string
): Promise<UploadResult> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/${documentType}-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(KYC_BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { url: "", path: "", error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(KYC_BUCKET_NAME).getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
}

// Avatar upload
const AVATARS_BUCKET_NAME = "avatars";

export async function uploadAvatar(
  file: File,
  userId: string
): Promise<UploadResult> {
  const supabase = createClient();

  const fileExt = file.name.split(".").pop();
  const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from(AVATARS_BUCKET_NAME)
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: true, // Allow overwriting existing avatar
    });

  if (uploadError) {
    return { url: "", path: "", error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(AVATARS_BUCKET_NAME).getPublicUrl(fileName);

  return { url: publicUrl, path: fileName };
}
