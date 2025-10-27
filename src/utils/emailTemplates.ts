/**
 * EMAIL TEMPLATES
 *
 * HTML email templates that include school branding and information.
 * Supports receipt emails, notifications, and reports.
 */

import type { SchoolConfig, Payment, Expense } from "@/types";

/**
 * Generate email header with school branding
 */
function getEmailHeader(config: SchoolConfig): string {
  return `
    <div style="background: linear-gradient(135deg, ${config.branding.primaryColor || "#4F46E5"} 0%, ${config.branding.secondaryColor || "#7C3AED"} 100%); padding: 30px 20px; text-align: center;">
      ${
        config.branding.logo
          ? `<img src="${config.branding.logo}" alt="${config.schoolName}" style="height: 60px; margin-bottom: 15px;" />`
          : ""
      }
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">${config.schoolName}</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">${config.address}, ${config.city}, ${config.state}</p>
      <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">
        ${config.phone} | ${config.email}
      </p>
    </div>
  `;
}

/**
 * Generate email footer
 */
function getEmailFooter(config: SchoolConfig): string {
  return `
    <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; margin-top: 30px;">
      <p style="color: #6b7280; margin: 0; font-size: 12px;">
        ${config.schoolName} - ${config.motto || "Excellence in Education"}
      </p>
      <p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 11px;">
        This is an automated email from ${config.schoolName} school management system.
      </p>
      ${config.website ? `<p style="color: #9ca3af; margin: 5px 0 0 0; font-size: 11px;"><a href="${config.website}" style="color: ${config.branding.primaryColor};">${config.website}</a></p>` : ""}
    </div>
  `;
}

/**
 * Base email template wrapper
 */
function wrapEmailTemplate(
  config: SchoolConfig,
  content: string,
  title: string,
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - ${config.schoolName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background: white;">
    ${getEmailHeader(config)}
    <div style="padding: 30px 20px;">
      ${content}
    </div>
    ${getEmailFooter(config)}
  </div>
</body>
</html>
  `;
}

/**
 * Payment Receipt Email
 */
export function generatePaymentReceiptEmail(
  config: SchoolConfig,
  payment: Payment,
  receiptNumber: string,
): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Payment Receipt</h2>
    
    <div style="background: #f9fafb; border-left: 4px solid ${config.branding.primaryColor}; padding: 15px; margin-bottom: 20px;">
      <p style="color: #6b7280; margin: 0; font-size: 14px;">Receipt Number</p>
      <p style="color: #111827; margin: 5px 0 0 0; font-size: 18px; font-weight: 600;">${receiptNumber}</p>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">Student Information</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Student Name:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${payment.studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Class:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${payment.className}</td>
        </tr>
        ${payment.paidBy ? `<tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Paid By:</td><td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${payment.paidBy}</td></tr>` : ""}
      </table>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">Payment Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${new Date(payment.paymentDate).toLocaleDateString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Method:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500; text-transform: capitalize;">${payment.paymentMethod.replace("_", " ")}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Reference:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${payment.reference}</td>
        </tr>
      </table>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">Payment Breakdown</h3>
      <table style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 8px;">
        <thead>
          <tr style="border-bottom: 2px solid #e5e7eb;">
            <th style="padding: 12px; text-align: left; color: #374151; font-size: 14px; font-weight: 600;">Fee Category</th>
            <th style="padding: 12px; text-align: right; color: #374151; font-size: 14px; font-weight: 600;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${payment.feeAllocations
            .map(
              (alloc) => `
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 12px; color: #111827; font-size: 14px;">${alloc.categoryName}</td>
              <td style="padding: 12px; text-align: right; color: #111827; font-size: 14px;">${config.currencySymbol}${alloc.amount.toLocaleString()}</td>
            </tr>
          `,
            )
            .join("")}
          <tr>
            <td style="padding: 12px; color: #111827; font-size: 16px; font-weight: 700;">Total Amount Paid</td>
            <td style="padding: 12px; text-align: right; color: ${config.branding.primaryColor}; font-size: 16px; font-weight: 700;">${config.currencySymbol}${payment.amount.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>

    ${payment.notes ? `<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin-bottom: 20px;"><p style="margin: 0; color: #92400e; font-size: 14px;"><strong>Note:</strong> ${payment.notes}</p></div>` : ""}

    <div style="background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 15px; margin-top: 25px;">
      <p style="margin: 0; color: #166534; font-size: 14px; text-align: center;">
        ✓ This is an official receipt. Please keep for your records.
      </p>
    </div>
  `;

  return wrapEmailTemplate(config, content, "Payment Receipt");
}

/**
 * Expense Approval Notification Email
 */
export function generateExpenseApprovalEmail(
  config: SchoolConfig,
  expense: Expense,
  action: "approved" | "rejected",
  approverName: string,
  comments?: string,
): string {
  const isApproved = action === "approved";

  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Expense ${isApproved ? "Approved" : "Rejected"}</h2>
    
    <div style="background: ${isApproved ? "#f0fdf4" : "#fef2f2"}; border-left: 4px solid ${isApproved ? "#22c55e" : "#ef4444"}; padding: 15px; margin-bottom: 20px;">
      <p style="color: ${isApproved ? "#166534" : "#991b1b"}; margin: 0; font-size: 16px; font-weight: 600;">
        ${isApproved ? "✓ Your expense has been approved" : "✗ Your expense was rejected"}
      </p>
    </div>

    <div style="margin-bottom: 25px;">
      <h3 style="color: #374151; font-size: 16px; margin: 0 0 10px 0;">Expense Details</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${config.currencySymbol}${expense.amount.toLocaleString()}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Category:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${expense.categoryName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Purpose:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${expense.purpose}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${typeof expense.expenseDate === 'string' ? new Date(expense.expenseDate).toLocaleDateString() : 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">${isApproved ? "Approved" : "Rejected"} By:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 500;">${approverName}</td>
        </tr>
      </table>
    </div>

    ${comments ? `<div style="background: #f9fafb; border-left: 4px solid ${config.branding.primaryColor}; padding: 15px; margin-bottom: 20px;"><p style="margin: 0; color: #374151; font-size: 14px;"><strong>Comments:</strong> ${comments}</p></div>` : ""}

    <p style="color: #6b7280; font-size: 14px; margin: 25px 0 0 0;">
      For questions about this ${action}, please contact the finance department.
    </p>
  `;

  return wrapEmailTemplate(
    config,
    content,
    `Expense ${isApproved ? "Approved" : "Rejected"}`,
  );
}

/**
 * Fee Reminder Email
 */
export function generateFeeReminderEmail(
  config: SchoolConfig,
  studentName: string,
  className: string,
  balance: number,
  dueDate: string,
): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Fee Payment Reminder</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Dear Parent/Guardian,
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      This is a friendly reminder regarding the outstanding fee balance for <strong>${studentName}</strong> (${className}).
    </p>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 25px 0;">
      <p style="margin: 0 0 10px 0; color: #92400e; font-size: 14px; font-weight: 600;">Outstanding Balance</p>
      <p style="margin: 0; color: #92400e; font-size: 32px; font-weight: 700;">${config.currencySymbol}${balance.toLocaleString()}</p>
      <p style="margin: 10px 0 0 0; color: #92400e; font-size: 14px;">Due Date: ${new Date(dueDate).toLocaleDateString()}</p>
    </div>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Please make payment at your earliest convenience to avoid any inconvenience. You can make payments at the school office or through our online payment portal.
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      If you have already made the payment, please disregard this notice and accept our apologies.
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
      Thank you for your continued support.
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Best regards,<br>
      <strong>${config.schoolName}</strong><br>
      Finance Department
    </p>
  `;

  return wrapEmailTemplate(config, content, "Fee Payment Reminder");
}

/**
 * Welcome Email for New Student
 */
export function generateWelcomeEmail(
  config: SchoolConfig,
  studentName: string,
  className: string,
  admissionNumber: string,
): string {
  const content = `
    <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 24px;">Welcome to ${config.schoolName}!</h2>
    
    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Dear Parent/Guardian,
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      We are delighted to welcome <strong>${studentName}</strong> to ${config.schoolName}!
    </p>

    <div style="background: linear-gradient(135deg, ${config.branding.primaryColor}15 0%, ${config.branding.secondaryColor}15 100%); border-radius: 8px; padding: 20px; margin: 25px 0;">
      <table style="width: 100%;">
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Student Name:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${studentName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Class:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${className}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Admission Number:</td>
          <td style="padding: 8px 0; color: #111827; font-size: 14px; font-weight: 600;">${admissionNumber}</td>
        </tr>
      </table>
    </div>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      ${config.motto ? `Our motto, "${config.motto}", reflects our commitment to providing quality education and fostering excellence in all our students.` : "We are committed to providing quality education and fostering excellence in all our students."}
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      For any questions or concerns, please don't hesitate to contact us at ${config.phone} or ${config.email}.
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 25px;">
      Once again, welcome to our school family!
    </p>

    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
      Best regards,<br>
      <strong>${config.schoolName}</strong><br>
      Administration
    </p>
  `;

  return wrapEmailTemplate(config, content, "Welcome to " + config.schoolName);
}
