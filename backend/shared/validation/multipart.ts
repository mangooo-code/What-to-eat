import { AppError } from "../errors/AppError";
import type { HttpEvent } from "../types/api";

export interface MultipartFile {
  fieldName: string;
  filename: string;
  mimeType: string;
  content: Buffer;
  size: number;
}

function headerValue(event: HttpEvent, name: string): string | undefined {
  const target = name.toLowerCase();
  return Object.entries(event.headers ?? {}).find(([key]) => key.toLowerCase() === target)?.[1];
}

function multipartBoundary(event: HttpEvent): string {
  const contentType = headerValue(event, "content-type") ?? "";
  const match = contentType.match(/^multipart\/form-data\s*;.*\bboundary=(?:"([^"]+)"|([^;\s]+))/i);
  const boundary = match?.[1] ?? match?.[2];
  if (!boundary) throw new AppError("INVALID_MULTIPART", "Request must be multipart/form-data", 400);
  return boundary;
}

function bodyBuffer(event: HttpEvent): Buffer {
  if (typeof event.body !== "string") {
    throw new AppError("INVALID_MULTIPART", "Multipart request body is required", 400);
  }
  return Buffer.from(event.body, event.isBase64Encoded ? "base64" : "latin1");
}

export function parseMultipartFiles(event: HttpEvent): MultipartFile[] {
  const boundary = multipartBoundary(event);
  const body = bodyBuffer(event);
  const delimiter = Buffer.from(`--${boundary}`);
  const nextDelimiter = Buffer.from(`\r\n--${boundary}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const files: MultipartFile[] = [];
  let cursor = body.indexOf(delimiter);

  if (cursor < 0) throw new AppError("INVALID_MULTIPART", "Multipart boundary was not found", 400);

  while (cursor >= 0) {
    cursor += delimiter.length;
    if (body.subarray(cursor, cursor + 2).equals(Buffer.from("--"))) break;
    if (!body.subarray(cursor, cursor + 2).equals(Buffer.from("\r\n"))) {
      throw new AppError("INVALID_MULTIPART", "Multipart body is malformed", 400);
    }
    const headerStart = cursor + 2;
    const headerEnd = body.indexOf(headerSeparator, headerStart);
    if (headerEnd < 0) throw new AppError("INVALID_MULTIPART", "Multipart headers are malformed", 400);
    const contentStart = headerEnd + headerSeparator.length;
    const contentEnd = body.indexOf(nextDelimiter, contentStart);
    if (contentEnd < 0) throw new AppError("INVALID_MULTIPART", "Multipart content is incomplete", 400);

    const headers = body.subarray(headerStart, headerEnd).toString("latin1");
    const disposition = headers.match(/content-disposition:\s*form-data\s*;([^\r\n]+)/i)?.[1] ?? "";
    const fieldName = disposition.match(/(?:^|;)\s*name="([^"]*)"/i)?.[1];
    const filename = disposition.match(/(?:^|;)\s*filename="([^"]*)"/i)?.[1];
    if (fieldName !== undefined && filename !== undefined) {
      const mimeType = headers.match(/(?:^|\r\n)content-type:\s*([^\r\n;]+)/i)?.[1]?.trim() ?? "";
      const content = body.subarray(contentStart, contentEnd);
      files.push({ fieldName, filename, mimeType, content, size: content.length });
    }
    cursor = contentEnd + 2;
  }

  return files;
}
