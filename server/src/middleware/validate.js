// Zod validation middleware. Validates and *replaces* the target with the
// parsed (and thus sanitised/typed) value so handlers receive clean data.

export function validate(schema, target = "body") {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }
    req[target] = result.data;
    next();
  };
}
