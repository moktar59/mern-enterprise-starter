import { randomUUID } from "node:crypto";
import {
  ExecutionContextConflictError,
  ExecutionContextEnrichmentError,
  type ExecutionContext,
  type ExecutionContextCreationInput,
  type Locale,
  type Principal,
  type TenantContext
} from "./execution-context.js";

export interface ExecutionContextFactory {
  create(input: ExecutionContextCreationInput): ExecutionContext;
  withPrincipal(context: ExecutionContext, principal: Principal): ExecutionContext;
  withTenant(context: ExecutionContext, tenant: TenantContext): ExecutionContext;
  withLocale(context: ExecutionContext, locale: Locale): ExecutionContext;
}

function freezeContext(context: ExecutionContext): ExecutionContext {
  return Object.freeze({
    ...context,
    ...(context.principal ? { principal: Object.freeze({ ...context.principal }) } : {}),
    ...(context.tenant ? { tenant: Object.freeze({ ...context.tenant }) } : {})
  });
}

/** Creates and derives immutable execution contexts without managing propagation. */
export class DefaultExecutionContextFactory implements ExecutionContextFactory {
  create(input: ExecutionContextCreationInput): ExecutionContext {
    return freezeContext({
      executionId: randomUUID(),
      source: input.source,
      startedAt: new Date().toISOString(),
      ...(input.requestId === undefined ? {} : { requestId: input.requestId }),
      ...(input.correlationId === undefined ? {} : { correlationId: input.correlationId })
    });
  }

  withPrincipal(context: ExecutionContext, principal: Principal): ExecutionContext {
    if (!principal.principalId.trim()) {
      throw new ExecutionContextEnrichmentError("Principal identity must not be empty.");
    }

    if (context.principal) {
      if (
        context.principal.principalId !== principal.principalId ||
        context.principal.principalType !== principal.principalType
      ) {
        throw new ExecutionContextConflictError("Execution context already has a different principal.");
      }
      return context;
    }

    return freezeContext({ ...context, principal });
  }

  withTenant(context: ExecutionContext, tenant: TenantContext): ExecutionContext {
    if (!tenant.id.trim()) {
      throw new ExecutionContextEnrichmentError("Tenant identity must not be empty.");
    }

    if (context.tenant) {
      if (context.tenant.id !== tenant.id) {
        throw new ExecutionContextConflictError("Execution context already has a different tenant.");
      }
      return context;
    }

    return freezeContext({ ...context, tenant });
  }

  withLocale(context: ExecutionContext, locale: Locale): ExecutionContext {
    if (!locale.trim()) {
      throw new ExecutionContextEnrichmentError("Locale must not be empty.");
    }

    if (context.locale !== undefined) {
      if (context.locale !== locale) {
        throw new ExecutionContextConflictError("Execution context already has a different locale.");
      }
      return context;
    }

    return freezeContext({ ...context, locale });
  }
}
