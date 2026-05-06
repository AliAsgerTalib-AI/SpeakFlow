export enum GeminiErrorType {
  API_ERROR = "API_ERROR",
  PARSE_ERROR = "PARSE_ERROR",
  VALIDATION_ERROR = "VALIDATION_ERROR",
  MISSING_FIELDS = "MISSING_FIELDS",
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class GeminiError extends Error {
  constructor(
    public type: GeminiErrorType,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "GeminiError";
  }

  isAPIError(): this is GeminiError & { type: GeminiErrorType.API_ERROR } {
    return this.type === GeminiErrorType.API_ERROR;
  }

  isParseError(): this is GeminiError & { type: GeminiErrorType.PARSE_ERROR } {
    return this.type === GeminiErrorType.PARSE_ERROR;
  }

  isValidationError(): this is GeminiError & { type: GeminiErrorType.VALIDATION_ERROR } {
    return this.type === GeminiErrorType.VALIDATION_ERROR;
  }

  isMissingFields(): this is GeminiError & { type: GeminiErrorType.MISSING_FIELDS } {
    return this.type === GeminiErrorType.MISSING_FIELDS;
  }
}

export type GeminiResult<T> =
  | { success: true; data: T }
  | { success: false; error: GeminiError };

export function validateRequiredFields(
  obj: Record<string, unknown>,
  requiredFields: string[]
): string[] {
  return requiredFields.filter((field) => !(field in obj) || obj[field] === undefined);
}
