import { z } from "zod";

export const StudentCreateSchema = z.object({
  surname: z
    .string()
    .trim()
    .min(1, "Surname is required")
    .max(50, "Max 50 characters"),
  firstname: z
    .string()
    .trim()
    .min(1, "First name is required")
    .max(50, "Max 50 characters"),
  middlename: z
    .string()
    .trim()
    .max(50, "Max 50 characters")
    .optional()
    .or(z.literal("")),
  admissionNumber: z
    .string()
    .trim()
    .min(1, "Admission number is required")
    .max(20, "Max 20 characters"),
  classId: z.string().min(1, "Class is required"),
  guardianSurname: z
    .string()
    .trim()
    .min(1, "Guardian surname is required")
    .max(50, "Max 50 characters"),
  guardianFirstname: z
    .string()
    .trim()
    .min(1, "Guardian first name is required")
    .max(50, "Max 50 characters"),
  guardianPhone: z
    .string()
    .trim()
    .regex(/^[\d\s\-+()]{10,20}$/i, "Invalid phone number format"),
  guardianEmail: z
    .string()
    .trim()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  guardianAddress: z
    .string()
    .trim()
    .max(200, "Max 200 characters")
    .optional()
    .or(z.literal("")),
  guardianRelationship: z.enum(["father", "mother", "guardian", "other"]),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be YYYY-MM-DD")
    .optional()
    .or(z.literal("")),
  gender: z.enum(["male", "female"]).optional().or(z.literal("")),
  admissionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Admission date must be YYYY-MM-DD"),
  bloodGroup: z
    .string()
    .trim()
    .max(5, "Max 5 characters")
    .optional()
    .or(z.literal("")),
});

export type StudentCreateInput = z.infer<typeof StudentCreateSchema>;
