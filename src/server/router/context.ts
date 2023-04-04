// src/server/router/context.ts
import * as trpc from "@trpc/server";
import * as trpcNext from "@trpc/server/adapters/next";
import { prisma } from "../db/client";


export const createContext = (opts: trpcNext.CreateNextContextOptions) => {
  const req = opts.req;
  const res = opts.res;

  return {
    req,
    res,
    prisma,
  };
};

type Context = trpc.inferAsyncReturnType<typeof createContext>;

export const createRouter = () => trpc.router<Context>()
  .middleware(async ({ path, type, next }) => {
    const start = Date.now();
    const result = await next();
    const durationMs = Date.now() - start;
    result.ok
      ? console.log("OK request timing:", { path, type, durationMs })
      : console.log("Non-OK request timing:", { path, type, durationMs, error: result.error })

    return result;
  });
