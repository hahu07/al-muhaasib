import { z } from "zod";

export const salaryPaymentFormSchema = z.object({
  staffId: z.string().min(1, "Staff member is required"),
  month: z
    .string()
    .regex(/^(0[1-9]|1[0-2])$/, "Month must be between 01 and 12"),
  year: z
    .string()
    .regex(/^\d{4}$/, "Year is required")
    .refine(
      (v) => Number(v) >= 2020 && Number(v) <= 2050,
      "Year must be between 2020 and 2050",
    ),
  paymentMethod: z.enum(["bank_transfer", "cash", "cheque"]),
  paymentDate: z
    .string()
    .refine(
      (val) => !Number.isNaN(Date.parse(val)),
      "Payment date is required",
    ),
});

export type SalaryPaymentFormValues = z.infer<typeof salaryPaymentFormSchema>;
