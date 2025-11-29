import { Middleware } from "./types";
import { HttpStatusCode } from "../models/StatusCode";

export const ErrorHandlerMiddleware: Middleware = (req, res, next) => {
  try {
    next();
  } catch (err) {
    console.error("Errorhandler got shi error", err);

    const error = err as Error;

    res.setStatus(HttpStatusCode.INTERNAL_SERVER_ERROR);
    res.headers.setContentType("application/json");
    res.setBody(
      JSON.stringify(
        {
          error: "Internal Server shi",
          message: error.message,
          path: req.path,
          method: req.method,
          timeStamp: new Date().toISOString(),
        },
        null,
        2
      )
    );
  }
};
