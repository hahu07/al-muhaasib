import { z } from "zod";

export const expenseFormSchema = z
  .object({
    categoryId: z.string().min(1, "Expense category is required"),
    amount: z.coerce
      .number()
      .positive("Amount must be greater than 0")
      .max(100_000_000, "Amount seems too large"),
    description: z.string().trim().min(3, "Description is required"),
    purpose: z.string().trim().optional(),
    paymentMethod: z.enum(["cash", "bank_transfer", "cheque", "pos", "online"]),
    paymentDate: z
      .string()
      .refine((val) => !Number.isNaN(Date.parse(val)), "Invalid date"),
    vendorName: z.string().trim().optional(),
    vendorContact: z
      .string()
      .trim()
      .regex(/^[\d\s\-+()]+$/, "Invalid contact format")
      .optional(),
    notes: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.amount >= 1_000_000 &&
      (!data.purpose || data.purpose.trim().length < 10)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["purpose"],
        message: "Purpose is required for expenses ≥ ₦1,000,000",
      });
    }
  });

export type ExpenseFormValues = z.infer<typeof expenseFormSchema>;
