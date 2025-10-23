// src/utils/validator.js
import { ZodError } from "zod";

export function validate({ body, params, query } = {}) {
  return (req, res, next) => {
    try {
      if (body)   req.body   = body.parse(req.body);
      if (params) req.params = params.parse(req.params);
      if (query)  req.query  = query.parse(req.query);
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        return res.status(400).json({ error: "Validation failed", details: e.errors });
      }
      next(e);
    }
  };
}
