use junobuild_satellite::{AssertSetDocContext, list_docs};
use junobuild_shared::types::list::{ListParams, ListMatcher};
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};
use super::utils::validation_utils::*;
use std::collections::HashMap;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaffMemberData {
    pub surname: String,
    pub firstname: String,
    pub middlename: Option<String>,
    pub staff_number: String,
    pub phone: String,
    pub email: Option<String>,
    pub address: Option<String>,
    pub position: String,
    pub department: Option<String>,
    pub employment_type: String,
    pub employment_date: String,
    pub basic_salary: f64,
    pub allowances: Option<Vec<StaffAllowance>>,
    pub bank_name: Option<String>,
    pub account_number: Option<String>,
    pub is_active: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StaffAllowance {
    pub name: String,
    pub amount: f64,
    pub is_recurring: bool,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SalaryPaymentData {
    pub staff_id: String,
    pub staff_name: String,
    pub staff_number: String,
    pub payment_date: String,
    pub payment_period_start: String,
    pub payment_period_end: String,
    pub basic_salary: f64,
    pub allowances: Vec<PaymentAllowanceItem>,
    pub deductions: Vec<PaymentDeductionItem>,
    pub net_salary: f64,
    pub payment_method: String,
    pub reference: String,
    pub status: String,
    pub notes: Option<String>,
    pub processed_by: String,
    pub processed_at: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentAllowanceItem {
    pub name: String,
    pub amount: f64,
    pub is_taxable: bool,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PaymentDeductionItem {
    pub name: String,
    pub amount: f64,
    pub is_statutory: bool,
}

// COMPREHENSIVE STAFF MANAGEMENT VALIDATION
    pub fn validate_staff_document(context: &AssertSetDocContext) -> Result<(), String> {
        let staff_data: StaffMemberData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid staff data format: {}", e))?;

        // Core staff validation
        validate_staff_core_fields(&staff_data)?;
        validate_staff_employment_details(&staff_data)?;
        validate_staff_salary_and_allowances(&staff_data)?;
        validate_staff_contact_information(&staff_data)?;
        validate_staff_banking_details(&staff_data)?;
        validate_staff_number_uniqueness(context, &staff_data)?;
        validate_staff_business_rules(&staff_data)?;
        
        Ok(())
    }

    pub fn validate_salary_payment_document(context: &AssertSetDocContext) -> Result<(), String> {
        let salary_data: SalaryPaymentData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid salary payment data format: {}", e))?;

        // Core salary payment validation
        validate_salary_core_fields(&salary_data)?;
        validate_salary_amounts_and_calculations(&salary_data)?;
        validate_salary_payment_period(&salary_data)?;
        validate_salary_payment_method(&salary_data)?;
        validate_salary_status_transitions(context, &salary_data)?;
        validate_salary_reference_uniqueness(context, &salary_data)?;
        validate_salary_business_rules(context, &salary_data)?;
        
        Ok(())
    }

    // Staff core field validation
    fn validate_staff_core_fields(staff: &StaffMemberData) -> Result<(), String> {
        // Minimal core validation - field-level checks moved to frontend
        if staff.basic_salary <= 0.0 {
            return Err("Basic salary must be greater than zero".to_string());
        }
        Ok(())
    }

    // Employment details validation
    fn validate_staff_employment_details(staff: &StaffMemberData) -> Result<(), String> {
        // Employment type validation
        let valid_employment_types = ["full-time", "part-time", "contract"];
        if !valid_employment_types.contains(&staff.employment_type.as_str()) {
            return Err(format!(
                "Invalid employment type '{}'. Must be one of: {}",
                staff.employment_type,
                valid_employment_types.join(", ")
            ));
        }
        
        // Employment date validation
        if !is_valid_date_format(&staff.employment_date) {
            return Err("Invalid employment date format. Must be YYYY-MM-DD".to_string());
        }
        
        // Employment date should not be in far future
        if is_date_too_far_in_future_30_days(&staff.employment_date) {
            return Err("Employment date cannot be more than 30 days in the future".to_string());
        }
        
        // Employment date should not be too old (more than 50 years)
        if is_employment_date_too_old(&staff.employment_date) {
            return Err("Employment date cannot be more than 50 years in the past".to_string());
        }
        
        // Department validation if provided
        if let Some(ref dept) = staff.department {
            if dept.len() > 50 {
                return Err(format!(
                    "Department name cannot exceed 50 characters (current: {})",
                    dept.len()
                ));
            }
            
            // Validate department name format
            if !dept.trim().is_empty() && !is_valid_department_name(dept) {
                return Err("Department name contains invalid characters".to_string());
            }
        }
        
        Ok(())
    }

    // Salary and allowances validation
    fn validate_staff_salary_and_allowances(staff: &StaffMemberData) -> Result<(), String> {
        // Moved to frontend
        if let Some(ref allowances) = staff.allowances {
            // Only check for duplicate allowance names (data integrity)
            let mut allowance_names = std::collections::HashSet::new();
            for allowance in allowances.iter() {
                if allowance_names.contains(&allowance.name) {
                    return Err(format!("Duplicate allowance name: '{}'", allowance.name));
                }
                allowance_names.insert(allowance.name.clone());
            }
        }
        Ok(())
    }

    // Contact information validation
    fn validate_staff_contact_information(_staff: &StaffMemberData) -> Result<(), String> {
        // Moved to frontend
        Ok(())
    }

    // Banking details validation
    fn validate_staff_banking_details(_staff: &StaffMemberData) -> Result<(), String> {
        // Moved to frontend
        Ok(())
    }

    // Staff number uniqueness validation
    fn validate_staff_number_uniqueness(
        context: &AssertSetDocContext,
        staff: &StaffMemberData
    ) -> Result<(), String> {
        let search_pattern = format!("staff_number={};", staff.staff_number);
        let existing = list_docs(
            String::from("staff"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );
        
        let is_update = !context.data.key.is_empty();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Staff number '{}' already exists", staff.staff_number));
        }
        
        Ok(())
    }

    // Staff business rules validation
    fn validate_staff_business_rules(_staff: &StaffMemberData) -> Result<(), String> {
        // Moved to frontend
        Ok(())
    }

    // Salary payment validation functions
    fn validate_salary_core_fields(salary: &SalaryPaymentData) -> Result<(), String> {
        // Minimal validation - field checks moved to frontend
        if salary.basic_salary <= 0.0 {
            return Err("Basic salary must be greater than zero".to_string());
        }
        Ok(())
    }

    fn validate_salary_amounts_and_calculations(salary: &SalaryPaymentData) -> Result<(), String> {
        // Core calculation validation
        let mut calculated_allowances_total = 0.0;
        let mut allowance_names = std::collections::HashSet::new();
        
        for allowance in salary.allowances.iter() {
            // Check for duplicate names (data integrity)
            if allowance_names.contains(&allowance.name) {
                return Err(format!("Duplicate allowance name: '{}'", allowance.name));
            }
            allowance_names.insert(allowance.name.clone());
            calculated_allowances_total += allowance.amount;
        }
        
        let mut calculated_deductions_total = 0.0;
        let mut deduction_names = std::collections::HashSet::new();
        
        for deduction in salary.deductions.iter() {
            // Check for duplicate names (data integrity)
            if deduction_names.contains(&deduction.name) {
                return Err(format!("Duplicate deduction name: '{}'", deduction.name));
            }
            deduction_names.insert(deduction.name.clone());
            calculated_deductions_total += deduction.amount;
        }
        
        // Core: validate calculation correctness
        let expected_gross = salary.basic_salary + calculated_allowances_total;
        let expected_net = expected_gross - calculated_deductions_total;
        if (salary.net_salary - expected_net).abs() > 0.01 {
            return Err(format!(
                "Net salary (₦{:.2}) doesn't match basic + allowances - deductions (₦{:.2})",
                salary.net_salary, expected_net
            ));
        }
        
        Ok(())
    }

    fn validate_salary_payment_period(salary: &SalaryPaymentData) -> Result<(), String> {
        // Validate payment date
        if !is_valid_date_format(&salary.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
        }
        if is_date_too_far_in_future_30_days(&salary.payment_date) {
            return Err("Payment date cannot be more than 30 days in the future".to_string());
        }
        
        // Validate period start/end
        if !is_valid_date_format(&salary.payment_period_start) || !is_valid_date_format(&salary.payment_period_end) {
            return Err("Payment period start and end must be valid dates (YYYY-MM-DD)".to_string());
        }
        let (sy, sm, sd) = parse_date(&salary.payment_period_start).map_err(|_| "Invalid payment_period_start".to_string())?;
        let (ey, em, ed) = parse_date(&salary.payment_period_end).map_err(|_| "Invalid payment_period_end".to_string())?;
        let start_ts = date_to_timestamp(sy, sm, sd);
        let end_ts = date_to_timestamp(ey, em, ed);
        if end_ts < start_ts {
            return Err("Payment period end cannot be before start".to_string());
        }
        
        // Ensure payment date falls within or after period start (soft check)
        let (py, pm, pd) = parse_date(&salary.payment_date).map_err(|_| "Invalid payment_date".to_string())?;
        let pay_ts = date_to_timestamp(py, pm, pd);
        if pay_ts < start_ts {
            return Err("Payment date cannot be before the period start".to_string());
        }
        
        Ok(())
    }

    fn validate_salary_payment_method(salary: &SalaryPaymentData) -> Result<(), String> {
        // Only validate enum
        let valid_methods = ["bank_transfer", "cash", "cheque"];
        if !valid_methods.contains(&salary.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                salary.payment_method,
                valid_methods.join(", ")
            ));
        }
        Ok(())
    }

    fn validate_salary_status_transitions(
        context: &AssertSetDocContext,
        salary: &SalaryPaymentData
    ) -> Result<(), String> {
        let valid_statuses = ["pending", "approved", "paid"];
        if !valid_statuses.contains(&salary.status.as_str()) {
            return Err(format!(
                "Invalid salary status '{}'. Must be one of: {}",
                salary.status,
                valid_statuses.join(", ")
            ));
        }
        
        // Check status transitions for updates
        if let Some(ref before_doc) = context.data.data.current {
            let before_salary: SalaryPaymentData = decode_doc_data(&before_doc.data)
                .map_err(|e| format!("Invalid previous salary data: {}", e))?;
            
            let valid_transitions = HashMap::from([
                ("pending", vec!["approved"]),
                ("approved", vec!["paid"]),
                ("paid", vec![]), // No transitions from paid
            ]);
            
            let current_status = &before_salary.status;
            let new_status = &salary.status;
            
            if current_status != new_status {
                if let Some(allowed_next_states) = valid_transitions.get(current_status.as_str()) {
                    if !allowed_next_states.contains(&new_status.as_str()) {
                        return Err(format!(
                            "Invalid status transition from '{}' to '{}'. Allowed: [{}]",
                            current_status,
                            new_status,
                            allowed_next_states.join(", ")
                        ));
                    }
                }
            }
            
            // Additional validation for status changes
            if new_status == "approved" && salary.processed_by.trim().is_empty() {
                return Err("Approved salary payments must have processed_by set".to_string());
            }
        } else {
            // New salary payments must start as pending
            if salary.status != "pending" {
                return Err("New salary payments must have status 'pending'".to_string());
            }
        }
        
        Ok(())
    }

    fn validate_salary_reference_uniqueness(
        context: &AssertSetDocContext,
        salary: &SalaryPaymentData
    ) -> Result<(), String> {
        // Validate reference format
        if !salary.reference.starts_with("SAL-") {
            return Err("Salary reference must start with 'SAL-'".to_string());
        }
        
        if !is_valid_salary_reference(&salary.reference) {
            return Err("Salary reference must follow format: SAL-YYYY-MM-XXXXXX".to_string());
        }
        
        // Check reference uniqueness
        let search_pattern = format!("reference={};", salary.reference);
        let existing = list_docs(
            String::from("salary_payments"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );
        
        let is_update = !context.data.key.is_empty();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Salary reference '{}' already exists", salary.reference));
        }
        
        Ok(())
    }

    fn validate_salary_business_rules(context: &AssertSetDocContext, salary: &SalaryPaymentData) -> Result<(), String> {
        // Core: prevent duplicate salary for same staff/period (only for 'paid' status)
        if salary.status == "paid" {
            let search_pattern = format!(
                "staff_id={}*payment_period_start={}*payment_period_end={}*status=paid;",
                salary.staff_id, salary.payment_period_start, salary.payment_period_end
            );
            
            let existing_payments = list_docs(
                String::from("salary_payments"),
                ListParams {
                    matcher: Some(ListMatcher {
                        description: Some(search_pattern),
                        ..Default::default()
                    }),
                    ..Default::default()
                },
            );
            
            let is_update = !context.data.key.is_empty();
            for (doc_key, _) in existing_payments.items {
                if is_update && doc_key == context.data.key {
                    continue;
                }
                
                return Err(format!(
                    "Staff {} already has a paid salary for period {} to {}",
                    salary.staff_number, salary.payment_period_start, salary.payment_period_end
                ));
            }
        }
        
        Ok(())
    }
