import { apiClient } from "./http";
import type { ApiSuccessResponse } from "./types";

// A seller reel can be up to 100 MB. Rather than stream it through our servers, the
// browser uploads it straight to Cloudinary using a short-lived signature our backend
// mints (the api_secret never reaches the client). The backend then resolves the
// canonical URL/duration from the returned public_id, so this layer only needs to
// hand back the public_id.

export interface VideoUploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  uploadPreset: string;
  publicId: string;
}

// Cloudinary requires every chunk except the last to be larger than 5 MB.
const CHUNK_SIZE = 6 * 1024 * 1024;
// Flaky mobile networks drop the odd chunk; retry the failed 6 MB slice rather than
// restarting the whole transfer.
const MAX_CHUNK_RETRIES = 2;

interface CloudinaryChunkResponse {
  public_id?: string;
  secure_url?: string;
  error?: { message?: string };
}

interface ChunkContext {
  start: number;
  end: number;
  fileSize: number;
  uniqueUploadId: string;
  signature: VideoUploadSignature;
  onProgress?: (pct: number) => void;
}

async function getVideoUploadSignature(): Promise<VideoUploadSignature> {
  const { data } = await apiClient.get<ApiSuccessResponse<VideoUploadSignature>>(
    "/seller/videos/upload-signature",
  );
  return data.data;
}

function postChunk(
  endpoint: string,
  file: File,
  context: ChunkContext,
): Promise<CloudinaryChunkResponse> {
  const { start, end, fileSize, uniqueUploadId, signature, onProgress } = context;

  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", endpoint, true);
    // Chunk reassembly is keyed on a single id shared by every chunk of the file.
    request.setRequestHeader("X-Unique-Upload-Id", uniqueUploadId);
    request.setRequestHeader("Content-Range", `bytes ${start}-${end - 1}/${fileSize}`);

    request.upload.onprogress = (event) => {
      if (!onProgress || !event.lengthComputable) return;
      onProgress(Math.min(100, Math.round(((start + event.loaded) / fileSize) * 100)));
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        try {
          resolve(request.responseText ? JSON.parse(request.responseText) : {});
        } catch {
          resolve({});
        }
        return;
      }
      let message = `Cloudinary upload failed (${request.status})`;
      try {
        const body = JSON.parse(request.responseText) as CloudinaryChunkResponse;
        if (body.error?.message) message = body.error.message;
      } catch {
        // Non-JSON error body — keep the status-code message.
      }
      reject(new Error(message));
    };

    request.onerror = () => reject(new Error("Network error during video upload"));
    request.onabort = () => reject(new Error("Video upload was aborted"));

    // `file`, `api_key` and `resource_type` (carried in the URL) are excluded from the
    // signature by Cloudinary; everything else here must match what the backend signed.
    const form = new FormData();
    form.append("file", file.slice(start, end));
    form.append("api_key", signature.apiKey);
    form.append("timestamp", String(signature.timestamp));
    form.append("signature", signature.signature);
    form.append("upload_preset", signature.uploadPreset);
    form.append("public_id", signature.publicId);
    request.send(form);
  });
}

async function sendChunkWithRetry(
  endpoint: string,
  file: File,
  context: ChunkContext,
): Promise<CloudinaryChunkResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_CHUNK_RETRIES; attempt += 1) {
    try {
      return await postChunk(endpoint, file, context);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Video upload failed");
}

/**
 * Mints a signature, then streams `file` to Cloudinary in 6 MB chunks over raw XHR
 * (the only transport that exposes per-chunk progress and `Content-Range`). The
 * session cookie and app interceptors are intentionally absent — this is a signed,
 * cross-origin request to Cloudinary, not a call to our own API.
 */
export async function uploadSellerVideo(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ publicId: string }> {
  const signature = await getVideoUploadSignature();
  const endpoint = `https://api.cloudinary.com/v1_1/${signature.cloudName}/video/upload`;
  const totalChunks = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));

  let finalResponse: CloudinaryChunkResponse = {};
  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    finalResponse = await sendChunkWithRetry(endpoint, file, {
      start,
      end,
      fileSize: file.size,
      uniqueUploadId: signature.publicId,
      signature,
      onProgress,
    });
  }

  if (!finalResponse.public_id) {
    throw new Error("Cloudinary did not confirm the upload");
  }
  return { publicId: finalResponse.public_id };
}
