import Link from 'next/link'

export default function RouteNotFound() {
  return (
    <section className="panel p-8">
      <h1>Page not found</h1>
      <p>The requested record or page could not be found.</p>
      <Link className="btn-primary mt-4 inline-block" href="/">
        Return to dashboard
      </Link>
    </section>
  )
}
