import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Student } from '@/lib/types'
import { money, amountInWords } from '@/lib/formatters'
import { useEffect, useRef, useState } from 'react'

export function InvoicePrint({ payment, student, onBack, gstRate = 18 }: { payment: Payment; student?: Student; onBack: () => void; gstRate?: number }) {
  const invoiceStudent = student ?? { registerId: payment.studentId, name: payment.student, course: 'Course fee payment', batch: payment.date, total: payment.amount, paid: payment.amount, phone: '—', status: 'Fully Paid' as const };
  // Fee-exclusive GST: payment.amount is the base taxable value
  const taxableValue = payment.amount;
  const gstAmount = gstRate > 0 ? Math.round(taxableValue * (gstRate / 100)) : 0;
  const halfGst = Math.round(gstAmount / 2);
  const grandTotal = taxableValue + gstAmount;

  const containerRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const scaleX = width / 794;
        const scaleY = height / 1123;
        setScale(Math.min(scaleX, scaleY));
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="preview-layout">
      <aside className="preview-sidebar">
        <div className="preview-sidebar-header">
          <Button variant="secondary" onClick={onBack} className="mb-4">
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>
          <h2>Invoice Details</h2>
        </div>
        <div className="preview-meta">
          <div className="preview-meta-item"><span>Receipt No</span><strong>{payment.invoice}</strong></div>
          <div className="preview-meta-item"><span>Customer</span><strong>{invoiceStudent.name}</strong></div>
          <div className="preview-meta-item"><span>Course</span><strong>{invoiceStudent.course}</strong></div>
          <div className="preview-meta-item"><span>Taxable Amt</span><strong>{money(taxableValue)}</strong></div>
          {gstRate > 0 && <div className="preview-meta-item"><span>GST ({gstRate}%)</span><strong>{money(gstAmount)}</strong></div>}
          <div className="preview-meta-item"><span>Grand Total</span><strong>{money(grandTotal)}</strong></div>
          <div className="preview-meta-item"><span>Date</span><strong>{payment.date}</strong></div>
        </div>
        <div className="preview-actions">
          <Button variant="default" style={{width: '100%'}} onClick={() => window.print()}>
            <Printer size={16} className="mr-2" /> Print / Save as PDF
          </Button>
        </div>
      </aside>
      <main className="preview-document-container" ref={containerRef} style={{ '--scale': scale } as React.CSSProperties}>
        <div className="preview-scaler-wrapper">
          <div className="preview-scaler-content">
            <article className="ttk-invoice-paper" id="invoice-paper">
              <InvoiceCopy payment={payment} student={invoiceStudent} taxableValue={taxableValue} gstAmount={gstAmount} halfGst={halfGst} grandTotal={grandTotal} gstRate={gstRate} copy="Customer Copy" />
              <InvoiceCopy payment={payment} student={invoiceStudent} taxableValue={taxableValue} gstAmount={gstAmount} halfGst={halfGst} grandTotal={grandTotal} gstRate={gstRate} copy="Office Copy" />
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}

function InvoiceCopy({ payment, student, taxableValue, gstAmount, halfGst, grandTotal, gstRate, copy }: {
  payment: Payment; student: Student; taxableValue: number; gstAmount: number; halfGst: number; grandTotal: number; gstRate: number; copy: string
}) {
  return (
    <section className="ttk-invoice-copy">
      <div className="ttk-invoice-top">
        <div>
          <h2>INVOICE - {payment.invoice}</h2>
          <span>Receipt ID - [ {payment.id} ]</span>
        </div>
        <b>{copy}</b>
      </div>
      <header className="ttk-invoice-brand">
        <div className="ttk-invoice-logo">TAI</div>
        <div>
          <h1>ThoorigAI Infotech</h1>
          <p>127, Ettayapuram Road, Melur Tuticorin, Tamil Nadu - 628002</p>
          <p>Phone: {student.phone} | Professional Learning &amp; Training</p>
          <strong>GST No: 33AAZFT3654J1ZI</strong>
        </div>
      </header>
      <div className="ttk-invoice-meta">
        <span><b>Customer:</b> {student.name}</span>
        <span><b>Mobile:</b> {student.phone}</span>
        <span><b>ID:</b> TAI-{student.registerId}</span>
        <span><b>Date:</b> {payment.date}</span>
      </div>
      <p className="ttk-course-line"><b>Course:</b> {student.course}</p>
      <div className="ttk-invoice-grid">
        <table>
          <thead>
            <tr><th>S.No</th><th>Particular</th><th>Amount</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td>Course fee payment ({payment.method})</td>
              <td>{money(taxableValue)}</td>
            </tr>
            {gstRate > 0 && (
              <>
                <tr className="ttk-gst-row">
                  <td />
                  <td>CGST ({gstRate / 2}%)</td>
                  <td>{money(halfGst)}</td>
                </tr>
                <tr className="ttk-gst-row">
                  <td />
                  <td>SGST ({gstRate / 2}%)</td>
                  <td>{money(gstAmount - halfGst)}</td>
                </tr>
              </>
            )}
            <tr className="ttk-total-row">
              <td />
              <td>Grand Total</td>
              <td>{money(grandTotal)}</td>
            </tr>
          </tbody>
        </table>
        <div className="ttk-payment-aside">
          <span>Payment Mode</span>
          <strong>{payment.method}</strong>
          <span>Transaction ID</span>
          <strong>{payment.id}</strong>
        </div>
      </div>
      <p className="ttk-amount-words">{amountInWords(grandTotal)}</p>
      <div className="ttk-invoice-terms">
        <b>Terms &amp; Conditions</b>
        <ol>
          {gstRate > 0
            ? <li>GST ({gstRate}%) is charged on top of the base course fee.</li>
            : <li>No GST applicable on this invoice.</li>
          }
          <li>Students must pay the full fees before completing the course.</li>
          <li>Agreed instalment dates help students complete the course on schedule.</li>
          <li>Registration fees are non-refundable once paid.</li>
          <li>Refunds are not allowed under normal circumstances.</li>
        </ol>
      </div>
      <div className="ttk-authorized">Authorized Signature</div>
    </section>
  );
}