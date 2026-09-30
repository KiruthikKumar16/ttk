import { brand } from '@/lib/brand'

export default function BrandSettingsPage() {
  const values = [
    ['Display name', brand.displayName],
    ['Legal name', brand.legalName],
    ['Short name', brand.shortName],
    ['Tagline', brand.tagline],
    ['Support email', brand.supportEmail],
    ['Website', brand.websiteUrl],
    ['Verification site', brand.verifyBaseUrl],
    ['Invoice prefix', brand.invoicePrefix],
  ] as const
  return (
    <main>
      <div className="page-heading">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>Brand information</h1>
          <p className="subcopy">Read-only details used by invoices, certificates, and public verification.</p>
        </div>
      </div>
      <dl className="panel grid gap-4 sm:grid-cols-2">
        {values.map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 break-words font-medium">{value || 'Not configured'}</dd>
          </div>
        ))}
      </dl>
    </main>
  )
}
