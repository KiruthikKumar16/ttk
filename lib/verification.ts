// lib/verification.ts
// Registry of document types to their public field selectors for verification

// Define the shape of the fetched document rows (we only fetch the needed fields)
export type CertificateDoc = {
  student_name: string;
  course_name: string;
  issue_date: string; // ISO date string
};

export type PaymentDoc = {
  invoice: string;
  amount: number; // Assuming amount is stored as number in payment
  gst_rate: number;
  payment_date: string; // ISO date string
};

// Define the shape of the public verification result for each document type
export type CertificateVerificationResult = {
  studentName: string;
  courseName: string;
  issueDate: string; // ISO date string
  status: 'Valid';
};

export type InvoiceVerificationResult = {
  invoiceNumber: string;
  amount: number;
  gstStatus: string; // e.g., 'GST Applied' or 'GST Exempt'
  issueDate: string; // ISO date string
  status: 'Valid';
};

// Union type for the possible verification results
export type PublicVerificationResult =
  | CertificateVerificationResult
  | InvoiceVerificationResult
  | { status: 'Invalid' };

// Type for the selector function
export type VerificationResultSelector<T> = (
  doc: T
) => PublicVerificationResult;

// Registry of document types to their selector functions
export const verificationRegistry = {
  certificate: (doc: CertificateDoc): PublicVerificationResult => ({
    studentName: doc.student_name,
    courseName: doc.course_name,
    issueDate: doc.issue_date,
    status: 'Valid',
  }),
  invoice: (doc: PaymentDoc): PublicVerificationResult => ({
    invoiceNumber: doc.invoice,
    amount: doc.amount,
    gstStatus: doc.gst_rate > 0 ? 'GST Applied' : 'GST Exempt',
    issueDate: doc.payment_date,
    status: 'Valid',
  }),
} as const;

// Helper function to get the selector for a doc type
export const getVerificationSelector = (
  docType: string
): VerificationResultSelector<any> | undefined => {
  return verificationRegistry[docType as keyof typeof verificationRegistry];
};