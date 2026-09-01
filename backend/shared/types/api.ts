export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

export interface HttpEvent {
  httpMethod?: string;
  requestContext?: { httpMethod?: string };
  headers?: Record<string, string | undefined>;
  path?: string;
  queryStringParameters?: Record<string, string | undefined>;
  body?: string | Record<string, unknown> | null;
  isBase64Encoded?: boolean;
}

export interface HttpResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}
