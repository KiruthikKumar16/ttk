import { ArrowLeft, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Payment, Student } from '@/lib/types'
import { money, amountInWords } from '@/lib/formatters'
import { useEffect, useRef, useState } from 'react'

export function InvoicePrint({ payment, student, onBack }: { payment: Payment; student?: Student; onBack: () => void }) {
  const invoiceStudent = student ?? { registerId: payment.studentId, name: payment.student, course: 'Course fee payment', batch: payment.date, total: payment.amount, paid: payment.amount, phone: '—', status: 'Fully Paid' as const };
  const gross = Math.round((payment.amount / 1.18) * 100) / 100;
  const gst = Math.round((payment.amount - gross) * 100) / 100;

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
          <div className="preview-meta-item"><span>Amount Paid</span><strong>{money(payment.amount)}</strong></div>
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
              <InvoiceCopy payment={payment} student={invoiceStudent} gross={gross} gst={gst} copy="Customer Copy" />
              <InvoiceCopy payment={payment} student={invoiceStudent} gross={gross} gst={gst} copy="Office Copy" />
            </article>
          </div>
        </div>
      </main>
    </div>
  );
}

// We need to define InvoiceCopy here because it's used in InvoicePrint and is not extracted yet.
// We'll extract it in a separate step, but for now we keep it to avoid breaking the app.
function InvoiceCopy({ payment, student, gross, gst, copy }: { payment: Payment; student: Student; gross: number; gst: number; copy: string }) { return <section className="ttk-invoice-copy"><div className="ttk-invoice-top"><div><h2>INVOICE - {payment.invoice}</h2><span>Receipt ID - [ {payment.id} ]</span></div><b>{copy}</b></div><header className="ttk-invoice-brand"><div className="ttk-invoice-logo">TAI</div><div><h1>ThoorigAI Infotech</h1><p>127, Ettayapuram Road, Melur Tuticorin, Tamil Nadu - 628002</p><p>Phone: {student.phone} | Professional Learning & Training</p><strong>GST No: 33AAZFT3654J1ZI</strong></div></header><div className="ttk-invoice-meta"><span><b>Customer:</b> {student.name}</span><span><b>Mobile:</b> {student.phone}</span><span><b>ID:</b> TAI-{student.registerId}</span><span><b>Date:</b> {payment.date}</span></div><p className="ttk-course-line"><b>Course:</b> {student.course}</p><div className="ttk-invoice-grid"><table><thead><tr><th>S.No</th><th>Particular</th><th>Gross Amount</th></tr></thead><tbody><tr><td>1</td><td>Course fee payment ({payment.method})</td><td>{money(gross)}</td></tr><tr className="ttk-gst-row"><td /><td>GST (18%)</td><td>{money(gst)}</td></tr><tr className="ttk-total-row"><td /><td>Grand Total</td><td>{money(payment.amount)}</td></tr></tbody></table><div className="ttk-payment-aside"><span>Payment Mode</span><strong>{payment.method}</strong><span>Transaction ID</span><strong>{payment.id}</strong></div></div><p className="ttk-amount-words">{amountInWords(payment.amount)}</p><div className="ttk-invoice-terms"><b>Terms & Conditions</b><ol><li>GST is included in the grand total shown above.</li><li>Students must pay the full fees before completing the course.</li><li>Agreed instalment dates help students complete the course on schedule.</li><li>Registration fees are non-refundable once paid.</li><li>Refunds are not allowed under normal circumstances.</li></ol></div><div className="ttk-authorized">Authorized Signature</div></section> }