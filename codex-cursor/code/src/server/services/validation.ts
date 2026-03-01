import { z } from "zod";

import { ValidationError } from "@/server/services/errors";

export function parseInput<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.infer<TSchema> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    throw new ValidationError("Input validation failed.", z.treeifyError(parsed.error));
  }

  return parsed.data;
}
