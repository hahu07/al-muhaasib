import { z } from "zod";

export const getPaymentFormSchema = (outstandingBalance: number) =>
  z.object({
    amount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .max(
        outstandingBalance || Number.MAX_SAFE_INTEGER,
        `Amount cannot exceed outstanding balance of ₦${outstandingBalance.toLocaleString()}`,
      ),
    paymentMethod: z.enum([
      "cash",
      "bank_transfer",
      "pos",
      "online",
      "cheque",
    ]),
    paymentDate: z
      .string()
      .refine(
        (val) => !Number.isNaN(Date.parse(val)),
        "Payment date is required",
      ),
    paidBy: z.string().trim().min(1, "Payer name is required"),
    reference: z.string().trim().optional(),
    notes: z.string().trim().optional(),
  });

export type PaymentFormValues = z.infer<
  ReturnType<typeof getPaymentFormSchema>
>;
