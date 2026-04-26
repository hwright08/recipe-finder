import type { H3Event } from "h3";
import { createError, getQuery, getRouterParams, readBody } from "h3";
import { ZodError, type z } from "zod";

type OptionalSchema = z.ZodTypeAny | undefined;
type ParsedSchema<TSchema extends OptionalSchema> = TSchema extends z.ZodTypeAny
  ? z.infer<TSchema>
  : undefined;

type RouteContext<
  TBody extends OptionalSchema,
  TParams extends OptionalSchema,
  TQuery extends OptionalSchema
> = {
  body: ParsedSchema<TBody>;
  params: ParsedSchema<TParams>;
  query: ParsedSchema<TQuery>;
};

type RouteOptions<
  TBody extends OptionalSchema,
  TParams extends OptionalSchema,
  TQuery extends OptionalSchema,
  TResult
> = {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
  handler: (event: H3Event, context: RouteContext<TBody, TParams, TQuery>) => TResult;
};

export function createRoute<
  TBody extends OptionalSchema = undefined,
  TParams extends OptionalSchema = undefined,
  TQuery extends OptionalSchema = undefined,
  TResult = unknown
>(options: RouteOptions<TBody, TParams, TQuery, TResult>) {
  return defineEventHandler(async (event) => {
    try {
      const context = {
        body: options.body ? options.body.parse(await readBody(event)) : undefined,
        params: options.params ? options.params.parse(getRouterParams(event)) : undefined,
        query: options.query ? options.query.parse(getQuery(event)) : undefined
      } as RouteContext<TBody, TParams, TQuery>;

      return await options.handler(event, context);
    } catch (error) {
      if (error instanceof ZodError) {
        throw createError({
          statusCode: 400,
          statusMessage: "Invalid request",
          data: {
            issues: error.issues
          }
        });
      }

      throw error;
    }
  });
}
