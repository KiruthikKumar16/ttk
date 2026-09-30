// Global fallback for Next.js App Router PageProps during standalone tsc execution before next build
declare global {
  interface PageProps<AppRoute = any> {
    params: Promise<any>
    searchParams: Promise<Record<string, string | string[] | undefined>>
  }
}

export {}
