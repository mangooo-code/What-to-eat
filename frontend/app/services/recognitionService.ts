import { ApiClientError, apiClient } from "./apiClient";

export interface RecognizedIngredientCandidate {
  name: string;
  normalizedName: string | null;
  quantity: number | null;
  unit: string | null;
}

export interface RecognizeIngredientsResult {
  items: RecognizedIngredientCandidate[];
}

export const recognitionService = {
  recognizeIngredients(image: File): Promise<RecognizeIngredientsResult> {
    const formData = new FormData();
    formData.append("image", image, image.name);
    return apiClient.postFormData<RecognizeIngredientsResult>("/recognize/ingredients", formData, {
      timeoutMs: 30_000,
    });
  },
};

export function getRecognitionErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    if (error.code === "IMAGE_TOO_LARGE") return "图片不能超过 10MB，请选择更小的图片。";
    if (error.code === "INVALID_IMAGE_TYPE") return "请选择有效的图片文件。";
    if (error.code === "IMAGE_REQUIRED" || error.code === "EMPTY_IMAGE") return "没有读取到图片，请重新拍摄或选择。";
    if (error.code === "REQUEST_TIMEOUT") return "图片识别请求超时，请直接重试。";
    if (error.code === "NETWORK_ERROR") return "网络连接异常，请检查网络后重试。";
    if (error.status === 401) return "登录状态已失效，请重新登录后再试。";
  }
  return "图片识别失败，请稍后直接重试。";
}
