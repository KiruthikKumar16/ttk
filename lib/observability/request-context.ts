import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'

type RequestContext = { requestId: string; userIdHash?: string }
const storage = new AsyncLocalStorage<RequestContext>()

export function withRequestContext<T>(context: RequestContext, action: () => T): T {
  return storage.run(context, action)
}

export function currentRequestId() {
  return storage.getStore()?.requestId ?? randomUUID()
}

export function currentRequestUserIdHash() {
  return storage.getStore()?.userIdHash
}
