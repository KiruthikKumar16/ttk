import { useState } from 'react'
import { Save, ToggleLeft, ToggleRight, Percent, Hash, AlertCircle, CheckCircle2, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { GstSettings } from '@/lib/types'
import { money } from '@/lib/formatters'

export function GstSettingsPage({
  settings,
  onSave,
}: {
  settings: GstSettings
  onSave: (s: GstSettings) => Promise<void>
}) {
  const [rate, setRate] = useState(String(settings.rate))
  const [gstin, setGstin] = useState(settings.gstin)
  const [enabled, setEnabled] = useState(settings.enabled)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [previewMode, setPreviewMode] = useState<'exclusive' | 'inclusive'>('exclusive')

  const rateNum = Number(rate) || 0
  const halfRate = rateNum / 2
  const sampleFee = 10000
  
  // Exclusive computation
  const sampleGstExclusive = Math.round(sampleFee * (rateNum / 100))
  const sampleTotalExclusive = sampleFee + sampleGstExclusive

  // Inclusive computation
  const sampleBaseInclusive = enabled && rateNum > 0 ? Math.round(sampleFee / (1 + rateNum / 100)) : sampleFee
  const sampleGstInclusive = sampleFee - sampleBaseInclusive
  const sampleHalfGstInclusive = Math.round(sampleGstInclusive / 2)

  const handleSave = async () => {
    const r = Number(rate)
    if (isNaN(r) || r < 0 || r > 100) {
      setError('GST rate must be between 0% and 100%.')
      return
    }
    if (!gstin.trim()) {
      setError('Please enter a valid GSTIN.')
      return
    }
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      await onSave({ rate: r, gstin: gstin.trim(), enabled })
      setSuccess('GST settings saved successfully.')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CONFIGURATION</p>
          <h1>GST Settings</h1>
          <p className="subcopy">Configure Goods & Services Tax rates, GSTIN, and tax computation for invoices.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GST Configuration Card */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Tax Configuration</h2>
              <p>Set your GST rate and registration number</p>
            </div>
          </div>
          <div className="p-6 pt-0 space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-sm text-green-600 flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            {/* Enable / Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-gray-100 bg-gray-50/50">
              <div>
                <p className="text-sm font-semibold text-gray-900">GST Invoicing</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {enabled ? 'GST will be calculated and shown on all invoices' : 'Invoices will not include GST computation'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnabled(!enabled)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                title={enabled ? 'Disable GST' : 'Enable GST'}
              >
                {enabled ? (
                  <ToggleRight size={36} className="text-green-500" />
                ) : (
                  <ToggleLeft size={36} />
                )}
              </button>
            </div>

            {/* GST Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Rate (%) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Percent size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.5"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g. 18"
                />
              </div>
              {rateNum > 0 && (
                <p className="text-xs text-gray-500 mt-1.5">
                  CGST: {halfRate}% + SGST: {halfRate}% = {rateNum}% total
                </p>
              )}
            </div>

            {/* GSTIN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GSTIN <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Hash size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={gstin}
                  onChange={e => setGstin(e.target.value.toUpperCase())}
                  maxLength={15}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-sm text-gray-900 font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="e.g. 33AAZFT3654J1ZI"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5">
                15-character GST Identification Number
              </p>
            </div>

            {/* Save Button */}
            <div className="pt-4 border-t border-gray-100">
              <Button
                variant="default"
                size="default"
                onClick={handleSave}
                disabled={saving}
                style={{ width: '100%' }}
              >
                <Save size={16} className="mr-2" />
                {saving ? 'Saving...' : 'Save Settings'}
              </Button>
            </div>
          </div>
        </section>

        {/* Live Preview Card */}
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Tax Breakdown Preview</h2>
              <p>How a ₹10,000 course fee is calculated under current settings</p>
            </div>
            <IndianRupee size={20} className="text-gray-400" />
          </div>
          <div className="p-6 pt-0 space-y-4">
            {/* Mode Toggle Buttons */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                type="button"
                onClick={() => setPreviewMode('exclusive')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  previewMode === 'exclusive'
                    ? 'bg-white text-gray-900 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                GST Exclusive Course
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('inclusive')}
                className={`flex-1 py-1.5 px-3 text-xs font-medium rounded-md transition-all cursor-pointer ${
                  previewMode === 'inclusive'
                    ? 'bg-white text-emerald-700 shadow-xs font-semibold'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                GST Inclusive Course
              </button>
            </div>

            <div className="rounded-xl border border-gray-100 overflow-hidden">
              {/* Header */}
              <div className="bg-gray-900 text-white px-5 py-3 flex items-center justify-between">
                <p className="text-xs font-semibold tracking-wide uppercase">
                  {previewMode === 'exclusive' ? 'GST Exclusive Breakdown' : 'GST Inclusive Breakdown'}
                </p>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  previewMode === 'exclusive' ? 'bg-amber-500/20 text-amber-200' : 'bg-emerald-500/20 text-emerald-200'
                }`}>
                  {previewMode === 'exclusive' ? '+GST Added On Top' : 'GST Included In Price'}
                </span>
              </div>

              {/* Breakdown Rows */}
              <div className="divide-y divide-gray-100">
                {previewMode === 'exclusive' ? (
                  <>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm text-gray-600">Base Course Fee</span>
                      <span className="text-sm font-semibold text-gray-900">{money(sampleFee)}</span>
                    </div>

                    {enabled && rateNum > 0 && (
                      <>
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                          <span className="text-xs text-gray-500">CGST ({halfRate}%)</span>
                          <span className="text-xs font-medium text-gray-600">{money(Math.round(sampleFee * (halfRate / 100)))}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                          <span className="text-xs text-gray-500">SGST ({halfRate}%)</span>
                          <span className="text-xs font-medium text-gray-600">{money(Math.round(sampleFee * (halfRate / 100)))}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 bg-blue-50/50">
                          <span className="text-xs text-blue-600 font-medium">Total GST (+{rateNum}%)</span>
                          <span className="text-xs font-semibold text-blue-700">+{money(sampleGstExclusive)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white">
                      <span className="text-sm font-semibold">Total Payable</span>
                      <span className="text-base font-bold">{enabled ? money(sampleTotalExclusive) : money(sampleFee)}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between px-5 py-3.5">
                      <span className="text-sm text-gray-600">Base Tuition (Taxable Value)</span>
                      <span className="text-sm font-semibold text-gray-900">{money(sampleBaseInclusive)}</span>
                    </div>

                    {enabled && rateNum > 0 && (
                      <>
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                          <span className="text-xs text-gray-500">CGST ({halfRate}%)</span>
                          <span className="text-xs font-medium text-gray-600">{money(sampleHalfGstInclusive)}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50/50">
                          <span className="text-xs text-gray-500">SGST ({halfRate}%)</span>
                          <span className="text-xs font-medium text-gray-600">{money(sampleGstInclusive - sampleHalfGstInclusive)}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-3 bg-emerald-50/50">
                          <span className="text-xs text-emerald-700 font-medium">Included GST ({rateNum}%)</span>
                          <span className="text-xs font-semibold text-emerald-700">{money(sampleGstInclusive)}</span>
                        </div>
                      </>
                    )}

                    <div className="flex items-center justify-between px-5 py-4 bg-gray-900 text-white">
                      <span className="text-sm font-semibold">Total Payable (All-Inclusive)</span>
                      <span className="text-base font-bold text-emerald-400">{money(sampleFee)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Info Note */}
            <div className={`p-3 rounded-lg border ${
              previewMode === 'exclusive' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              <p className="text-xs">
                {previewMode === 'exclusive' ? (
                  <><strong>Exclusive Courses:</strong> GST is added on top of the course fee. Each student pays Base Fee + {rateNum}% GST.</>
                ) : (
                  <><strong>Inclusive Courses:</strong> The course price already contains {rateNum}% GST. Base taxable revenue and tax are extracted automatically.</>
                )}
              </p>
            </div>

            {!enabled && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <p className="text-xs text-gray-500">
                  GST is currently <strong>disabled</strong>. Invoices will show only the base course fee without tax computation.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
