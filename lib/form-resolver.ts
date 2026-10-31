import type { FieldError, FieldErrors, FieldValues, Resolver } from "react-hook-form"
import type { ZodType } from "zod"

/** Zod 4 reports issues on `error.issues`. The installed resolver still reads Zod 3's `error.errors`. */
export function formResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const parsed = await schema.safeParseAsync(values)
    if (parsed.success) {
      return { values: parsed.data, errors: {} }
    }
    const errors: Record<string, FieldError> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0]
      if (typeof field !== "string" || errors[field]) continue
      errors[field] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: errors as FieldErrors<T> }
  }
}
