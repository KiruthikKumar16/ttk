import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const requiredEnv = [
  'SUPABASE_TEST_URL',
  'SUPABASE_TEST_PUBLISHABLE_KEY',
  'SUPABASE_TEST_SERVICE_ROLE_KEY',
  'SUPABASE_TEST_USER_EMAIL',
  'SUPABASE_TEST_USER_PASSWORD',
] as const
const missingEnv = requiredEnv.filter((name) => !process.env[name])
if (missingEnv.length) throw new Error(`Missing local integration test environment: ${missingEnv.join(', ')}`)

describe('atomic money operations (local Supabase)', () => {
  let userClient: SupabaseClient
  let adminClient: SupabaseClient
  const studentIds: number[] = []
  const idempotencyKeys: string[] = []

  beforeAll(async () => {
    const url = process.env.SUPABASE_TEST_URL!
    userClient = createClient(url, process.env.SUPABASE_TEST_PUBLISHABLE_KEY!, { auth: { persistSession: false } })
    adminClient = createClient(url, process.env.SUPABASE_TEST_SERVICE_ROLE_KEY!, { auth: { persistSession: false } })
    const { error } = await userClient.auth.signInWithPassword({
      email: process.env.SUPABASE_TEST_USER_EMAIL!,
      password: process.env.SUPABASE_TEST_USER_PASSWORD!,
    })
    if (error) throw error
  })

  afterAll(async () => {
    for (const registerId of studentIds) {
      const { data: student } = await adminClient
        .from('students')
        .select('id')
        .eq('register_id', registerId)
        .maybeSingle()
      if (student?.id) {
        const { data: payments } = await adminClient.from('payments').select('id').eq('student_id', student.id)
        const paymentIds = (payments ?? []).map((payment) => payment.id)
        if (paymentIds.length) await adminClient.from('verifiable_documents').delete().in('reference_id', paymentIds)
        await adminClient.from('payments').delete().eq('student_id', student.id)
        await adminClient.from('students').delete().eq('id', student.id)
      }
    }
    for (const key of idempotencyKeys) await adminClient.from('idempotency_keys').delete().eq('idempotency_key', key)
    // Verification records are immutable by design. test:ci uses a fresh local
    // database reset for each run, so test documents are isolated by that reset.
  })

  async function createStudent(total: number, phone: string) {
    const { data, error } = await userClient.rpc('create_student_with_payment', {
      p_student: {
        name: 'Atomic integration fixture',
        phone,
        course: 'Integration',
        batch: '2026-09-28',
        total,
        knowledge_tags: [],
      },
      p_initial_payment_amount: 0,
      p_initial_payment_date: '2026-09-28',
      p_verification_code: `unused-${crypto.randomUUID()}`,
    })
    if (error) throw error
    const registerId = Number((data as { student: { register_id: number } }).student.register_id)
    studentIds.push(registerId)
    return registerId
  }

  async function record(registerId: number, key: string, hash: string, amount: number, code: string) {
    idempotencyKeys.push(key)
    return userClient.rpc('record_payment_idempotent', {
      p_idempotency_key: key,
      p_request_hash: hash,
      p_student_register_id: registerId,
      p_amount: amount,
      p_method: 'Integration test',
      p_payment_date: '2026-09-28',
      p_transaction_id: null,
      p_custom_note: null,
      p_gst_rate: 0,
      p_cgst: 0,
      p_sgst: 0,
      p_verification_code: code,
    })
  }

  it('serializes concurrent payments so the balance cannot be exceeded', async () => {
    const registerId = await createStudent(10_000, `test-${crypto.randomUUID()}`)
    const results = await Promise.all([
      record(registerId, crypto.randomUUID(), 'a'.repeat(64), 7_000, crypto.randomUUID()),
      record(registerId, crypto.randomUUID(), 'b'.repeat(64), 7_000, crypto.randomUUID()),
    ])
    expect(results.filter((result) => !result.error)).toHaveLength(1)
    expect(results.filter((result) => result.error)).toHaveLength(1)
    const { data, error } = await userClient.from('students').select('paid').eq('register_id', registerId).single()
    if (error) throw error
    expect(Number(data?.paid)).toBe(7_000)
  })

  it('returns the original payment when the same idempotency key is retried', async () => {
    const registerId = await createStudent(10_000, `test-${crypto.randomUUID()}`)
    const key = crypto.randomUUID()
    const code = crypto.randomUUID()
    idempotencyKeys.push(key)
    const requestHash = 'c'.repeat(64)
    const results = await Promise.all([
      record(registerId, key, requestHash, 3_000, code),
      record(registerId, key, requestHash, 3_000, crypto.randomUUID()),
    ])
    expect(results.every((result) => !result.error)).toBe(true)
    expect((results[0].data as { payment: { id: string } }).payment.id).toBe(
      (results[1].data as { payment: { id: string } }).payment.id,
    )
    const { count, error } = await userClient
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('student_register_id', registerId)
    if (error) throw error
    expect(count).toBe(1)
  })

  it('rolls back student and payment rows if the invoice verification insert fails', async () => {
    const duplicateCode = `rollback-${crypto.randomUUID()}`
    const { error: seedError } = await userClient.from('verifiable_documents').insert({
      doc_type: 'invoice',
      reference_id: crypto.randomUUID(),
      verification_code: duplicateCode,
    })
    if (seedError) throw seedError

    const phone = `rollback-${crypto.randomUUID()}`
    const { error } = await userClient.rpc('create_student_with_payment', {
      p_student: {
        name: 'Must roll back',
        phone,
        course: 'Integration',
        batch: '2026-09-28',
        total: 10_000,
        knowledge_tags: [],
      },
      p_initial_payment_amount: 2_000,
      p_initial_payment_date: '2026-09-28',
      p_verification_code: duplicateCode,
    })
    expect(error).toBeTruthy()
    const { count: studentCount, error: studentLookupError } = await userClient
      .from('students')
      .select('id', { count: 'exact', head: true })
      .eq('phone', phone)
    if (studentLookupError) throw studentLookupError
    expect(studentCount).toBe(0)
  })
})
