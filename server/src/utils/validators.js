const { z } = require('zod');

const MIN_YEAR = 2000;

const dateString = z
  .string({ required_error: 'Date is required' })
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use the format YYYY-MM-DD')
  .refine((s) => {
    const d = new Date(`${s}T00:00:00.000Z`);
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
  }, 'Enter a real calendar date')
  .refine((s) => Number(s.slice(0, 4)) >= MIN_YEAR, `Date cannot be before ${MIN_YEAR}`)
  .refine((s) => new Date(`${s}T00:00:00.000Z`).getTime() <= Date.now() + 36 * 3600 * 1000, 'Date cannot be in the future');

const text = (max) => z.string().trim().max(max).optional().default('');

const transactionSchema = z.object({
  transactionDate: dateString,
  type: z.enum(['RECEIVED', 'EXPENSE'], { errorMap: () => ({ message: 'Choose Received or Expense' }) }),
  paymentMode: z.enum(['GPAY', 'CASH'], { errorMap: () => ({ message: 'Choose GPay or Cash' }) }),
  amount: z.coerce
    .number({ invalid_type_error: 'Enter a valid amount' })
    .positive('Amount must be greater than zero')
    .max(100000000, 'Amount is too large')
    .refine((v) => Math.round(v * 100) / 100 === v, 'Use at most 2 decimal places'),
  category: z.string().trim().optional().nullable(),
  description: z.string({ required_error: 'Description is required' }).trim().min(2, 'Description is required').max(200),
  receivedFrom: text(100),
  paidTo: text(100),
  notes: text(500),
  clientRequestId: z.string().max(100).optional(),
});

const authSchema = {
  register: z.object({
    name: z.string().trim().min(2, 'Name is required').max(80),
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(100),
  }),
  login: z.object({
    email: z.string().trim().email('Enter a valid email'),
    password: z.string().min(1, 'Password is required'),
  }),
};

const categorySchema = z.object({ name: z.string().trim().min(2, 'Name is required').max(60) });

const settingsSchema = z.object({
  openingBalances: z.object({
    GPAY: z.coerce.number().min(0, 'Opening balance cannot be negative').max(1e9),
    CASH: z.coerce.number().min(0, 'Opening balance cannot be negative').max(1e9),
  }),
  allowNegative: z.boolean(),
});

const periodQuery = z.object({
  year: z.coerce.number().int().min(MIN_YEAR).max(2100).optional(),
  month: z.coerce.number().int().min(1).max(12).optional(),
});

module.exports = { transactionSchema, authSchema, categorySchema, settingsSchema, periodQuery };
