import { requireAuth } from "../../../shared/auth";
import { AppError } from "../../../shared/errors/AppError";
import { successResponse } from "../../../shared/errors/httpResponse";
import type { HttpEvent, HttpResponse } from "../../../shared/types/api";
import { getMethod } from "../../../shared/validation/http";
import { parseMultipartFiles } from "../../../shared/validation/multipart";
import { recognizeIngredientImage } from "../helpers/ingredientRecognition";

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export async function handleRecognizeIngredients(event: HttpEvent): Promise<HttpResponse> {
  if (getMethod(event) !== "POST") {
    throw new AppError("METHOD_NOT_ALLOWED", "Method not allowed", 405);
  }
  requireAuth(event);
  const imageFiles = parseMultipartFiles(event).filter((file) => file.fieldName === "image");
  if (imageFiles.length !== 1) {
    throw new AppError("IMAGE_REQUIRED", "Exactly one image file is required", 400);
  }
  const image = imageFiles[0];
  if (image.size === 0) throw new AppError("EMPTY_IMAGE", "Image file must not be empty", 400);
  if (!/^image\/[a-z0-9.+-]+$/i.test(image.mimeType)) {
    throw new AppError("INVALID_IMAGE_TYPE", "Uploaded file must be an image", 415);
  }
  if (image.size > MAX_IMAGE_BYTES) {
    throw new AppError("IMAGE_TOO_LARGE", "Image file must not exceed 10MB", 413);
  }

  const recognition = await recognizeIngredientImage(image.content, image.mimeType);
  return successResponse(recognition);
}
