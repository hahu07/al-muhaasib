use junobuild_macros::{
    assert_delete_asset, assert_delete_doc, assert_set_doc, assert_upload_asset, on_delete_asset,
    on_delete_doc, on_delete_filtered_assets, on_delete_filtered_docs, on_delete_many_assets,
    on_delete_many_docs, on_set_doc, on_set_many_docs, on_upload_asset,
};
use junobuild_satellite::{
    include_satellite, AssertDeleteAssetContext, AssertDeleteDocContext, AssertSetDocContext,
    AssertUploadAssetContext, OnDeleteAssetContext, OnDeleteDocContext,
    OnDeleteFilteredAssetsContext, OnDeleteFilteredDocsContext, OnDeleteManyAssetsContext,
    OnDeleteManyDocsContext, OnSetDocContext, OnSetManyDocsContext, OnUploadAssetContext,
};

// All the available hooks and assertions for your Datastore and Storage are scaffolded by default in this `lib.rs` module.
// However, if you don’t have to implement all of them, for example to improve readability or reduce unnecessary logic,
// you can selectively enable only the features you need.
//
// To do this, disable the default features in your `Cargo.toml` and explicitly specify only the ones you want to use.
//
// For example, if you only need `on_set_doc`, configure your `Cargo.toml` like this:
//
// [dependencies]
// junobuild-satellite = { version = "0.0.22", default-features = false, features = ["on_set_doc"] }
//
// With this setup, only `on_set_doc` must be implemented with custom logic,
// and other hooks and assertions can be removed. They will not be included in your Satellite.

#[on_set_doc]
async fn on_set_doc(_context: OnSetDocContext) -> Result<(), String> {
    Ok(())
}

#[on_set_many_docs]
async fn on_set_many_docs(_context: OnSetManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_doc]
async fn on_delete_doc(_context: OnDeleteDocContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_docs]
async fn on_delete_many_docs(_context: OnDeleteManyDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_filtered_docs]
async fn on_delete_filtered_docs(_context: OnDeleteFilteredDocsContext) -> Result<(), String> {
    Ok(())
}

#[on_upload_asset]
async fn on_upload_asset(_context: OnUploadAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_asset]
async fn on_delete_asset(_context: OnDeleteAssetContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_many_assets]
async fn on_delete_many_assets(_context: OnDeleteManyAssetsContext) -> Result<(), String> {
    Ok(())
}

#[on_delete_filtered_assets]
async fn on_delete_filtered_assets(_context: OnDeleteFilteredAssetsContext) -> Result<(), String> {
    Ok(())
}

// Include our production-grade assert functions
mod expense_assertions {
    use junobuild_satellite::{
        list_docs, decode_doc_data, AssertSetDocContext, ListParams, ListMatcher
    };
    use serde::{Deserialize, Serialize};
    use std::collections::HashMap;

    // Data structures for validation
    #[derive(Deserialize, Serialize)]
    pub struct ExpenseData {
        pub category_id: String,
        pub category_name: String,
        pub category: String,
        pub amount: f64,
        pub description: String,
        pub purpose: Option<String>,
        pub payment_method: String,
        pub payment_date: String,
        pub vendor_name: Option<String>,
        pub vendor_contact: Option<String>,
        pub reference: String,
        pub invoice_url: Option<String>,
        pub status: String,
        pub approved_by: Option<String>,
        pub approved_at: Option<u64>,
        pub notes: Option<String>,
        pub recorded_by: String,
        pub created_at: u64,
        pub updated_at: u64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct ExpenseCategoryData {
        pub name: String,
        pub category: String,
        pub description: Option<String>,
        pub budget_code: Option<String>,
        pub is_active: bool,
        pub created_at: u64,
        pub updated_at: u64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct StudentData {
        pub student_id: String,
        pub surname: String,
        pub firstname: String,
        pub middlename: Option<String>,
        pub gender: String,
        pub date_of_birth: String,
        pub class_id: String,
        pub class_name: String,
        pub admission_date: String,
        pub guardian_name: String,
        pub guardian_phone: String,
        pub guardian_email: Option<String>,
        pub address: Option<String>,
        pub is_active: bool,
        pub created_at: u64,
        pub updated_at: u64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct PaymentData {
        pub student_id: String,
        pub student_name: String,
        pub class_id: String,
        pub class_name: String,
        pub fee_assignment_id: String,
        pub amount: f64,
        pub payment_method: String,
        pub payment_date: String,
        pub fee_allocations: Vec<PaymentAllocation>,
        pub reference: String,
        pub transaction_id: Option<String>,
        pub paid_by: Option<String>,
        pub status: String,
        pub notes: Option<String>,
        pub receipt_url: Option<String>,
        pub recorded_by: String,
        pub created_at: u64,
        pub updated_at: u64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct PaymentAllocation {
        pub category_id: String,
        pub category_name: String,
        pub fee_type: String,
        pub amount: f64,
    }

    #[derive(Deserialize, Serialize)]
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
    pub struct StaffAllowance {
        pub name: String,
        pub amount: f64,
        pub is_recurring: bool,
    }

    #[derive(Deserialize, Serialize)]
    pub struct SalaryPaymentData {
        pub staff_id: String,
        pub staff_name: String,
        pub staff_number: String,
        pub month: String,
        pub year: String,
        pub basic_salary: f64,
        pub allowances: Vec<PaymentAllowanceItem>,
        pub total_gross: f64,
        pub deductions: Vec<PaymentDeductionItem>,
        pub total_deductions: f64,
        pub net_pay: f64,
        pub payment_method: String,
        pub payment_date: String,
        pub reference: String,
        pub status: String,
        pub recorded_by: String,
        pub approved_by: Option<String>,
        pub created_at: u64,
        pub updated_at: u64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct PaymentAllowanceItem {
        pub name: String,
        pub amount: f64,
    }

    #[derive(Deserialize, Serialize)]
    pub struct PaymentDeductionItem {
        pub name: String,
        pub amount: f64,
    }

    pub fn validate_expense_document(context: &AssertSetDocContext) -> Result<(), String> {
        let expense_data: ExpenseData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid expense data format: {}", e))?;

        // Core expense validation
        validate_expense_basic_fields(&expense_data)?;
        
        // Status transition and approval validation
        validate_expense_status_transition(context, &expense_data)?;
        
        // Business rule validation
        validate_expense_business_rules(context, &expense_data)?;
        
        // Referential integrity validation
        validate_expense_category_exists(&expense_data.category_id)?;
        
        // Format validation
        validate_expense_formats(&expense_data)?;
        
        // Amount-specific validation rules
        validate_expense_amount_rules(&expense_data)?;
        
        // Approval workflow validation
        validate_expense_approval_workflow(context, &expense_data)?;

        Ok(())
    }
    
    fn validate_expense_basic_fields(expense_data: &ExpenseData) -> Result<(), String> {
        // Validate amount (following production pattern with clear ranges)
        if expense_data.amount <= 0.0 {
            return Err("Expense amount must be greater than 0".to_string());
        }
        if expense_data.amount > 100_000_000.0 {
            return Err(format!(
                "Expense amount cannot exceed ₦100,000,000 (got: ₦{})", 
                expense_data.amount
            ));
        }

        // Validate description (following production length check pattern)
        if expense_data.description.trim().is_empty() {
            return Err("Expense description is required".to_string());
        }
        if expense_data.description.len() > 500 {
            return Err(format!(
                "Expense description cannot exceed 500 characters (current length: {})",
                expense_data.description.len()
            ));
        }
        
        // Validate purpose length if provided
        if let Some(ref purpose) = expense_data.purpose {
            if purpose.len() > 200 {
                return Err(format!(
                    "Expense purpose cannot exceed 200 characters (current length: {})",
                    purpose.len()
                ));
            }
        }
        
        // Validate notes length if provided
        if let Some(ref notes) = expense_data.notes {
            if notes.len() > 1000 {
                return Err(format!(
                    "Expense notes cannot exceed 1000 characters (current length: {})",
                    notes.len()
                ));
            }
        }
        
        // Validate recorded_by is not empty
        if expense_data.recorded_by.trim().is_empty() {
            return Err("Expense must have a recorded_by user".to_string());
        }
        
        Ok(())
    }
    
    fn validate_expense_formats(expense_data: &ExpenseData) -> Result<(), String> {
        // Validate payment method (following production whitelist pattern)
        let valid_payment_methods = ["cash", "bank_transfer", "cheque", "pos"];
        if !valid_payment_methods.contains(&expense_data.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                expense_data.payment_method,
                valid_payment_methods.join(", ")
            ));
        }

        // Validate reference format
        if !expense_data.reference.starts_with("EXP-") {
            return Err("Expense reference must start with 'EXP-'".to_string());
        }
        
        // Validate reference format more strictly
        if !is_valid_expense_reference(&expense_data.reference) {
            return Err("Expense reference must be in format EXP-YYYY-XXXXXXXX".to_string());
        }

        // Validate date format
        if !is_valid_date_format(&expense_data.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
        }
        
        // Validate payment date is not in the future (more than 7 days)
        if is_date_too_far_in_future(&expense_data.payment_date) {
            return Err("Payment date cannot be more than 7 days in the future".to_string());
        }
        
        // Validate payment date is not too old (more than 1 year)
        if is_date_too_old(&expense_data.payment_date) {
            return Err("Payment date cannot be more than 1 year in the past".to_string());
        }

        // Validate vendor contact format if provided
        if let Some(ref contact) = expense_data.vendor_contact {
            if !contact.trim().is_empty() && !is_valid_phone_number(contact) {
                return Err("Invalid vendor contact format. Must be a valid phone number".to_string());
            }
        }
        
        // Validate invoice URL format if provided
        if let Some(ref url) = expense_data.invoice_url {
            if !url.trim().is_empty() && !is_valid_url(url) {
                return Err("Invalid invoice URL format".to_string());
            }
        }
        
        Ok(())
    }
    
    fn validate_expense_amount_rules(expense_data: &ExpenseData) -> Result<(), String> {
        // High-value expense validation
        if expense_data.amount > 1_000_000.0 {
            // For expenses over ₦1M, require additional documentation
            if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().trim().is_empty() {
                return Err("Expenses over ₦1,000,000 must include a detailed purpose".to_string());
            }
            if expense_data.vendor_name.is_none() || expense_data.vendor_name.as_ref().unwrap().trim().is_empty() {
                return Err("Expenses over ₦1,000,000 must include vendor name".to_string());
            }
        }
        
        // Cash payment limits
        if expense_data.payment_method == "cash" && expense_data.amount > 100_000.0 {
            return Err("Cash payments cannot exceed ₦100,000. Use bank transfer for larger amounts".to_string());
        }
        
        // POS payment limits
        if expense_data.payment_method == "pos" && expense_data.amount > 500_000.0 {
            return Err("POS payments cannot exceed ₦500,000. Use bank transfer for larger amounts".to_string());
        }
        
        // Amount precision validation (no more than 2 decimal places)
        let amount_str = format!("{:.2}", expense_data.amount);
        let parsed_amount: f64 = amount_str.parse().unwrap_or(0.0);
        if (expense_data.amount - parsed_amount).abs() > 0.001 {
            return Err("Expense amount cannot have more than 2 decimal places".to_string());
        }
        
        Ok(())
    }
    
    fn validate_expense_business_rules(context: &AssertSetDocContext, expense_data: &ExpenseData) -> Result<(), String> {
        // Duplicate reference check (within the same year)
        validate_expense_reference_uniqueness(context, &expense_data.reference)?;
        
        // Same vendor, same amount, same date check (potential duplicate)
        if let Some(ref vendor) = expense_data.vendor_name {
            validate_potential_duplicate_expense(context, expense_data, vendor)?;
        }
        
        // Category-specific business rules
        validate_category_specific_rules(expense_data)?;
        
        // Weekend/holiday expense validation
        validate_weekend_holiday_rules(expense_data)?;
        
        Ok(())
    }
    
    fn validate_expense_approval_workflow(context: &AssertSetDocContext, expense_data: &ExpenseData) -> Result<(), String> {
        match expense_data.status.as_str() {
            "pending" => {
                // New pending expenses should not have approval fields set
                if expense_data.approved_by.is_some() {
                    return Err("Pending expenses cannot have approved_by field set".to_string());
                }
                if expense_data.approved_at.is_some() {
                    return Err("Pending expenses cannot have approved_at field set".to_string());
                }
            },
            "approved" => {
                // Approved expenses must have approval fields
                if expense_data.approved_by.is_none() {
                    return Err("Approved expenses must have approved_by field set".to_string());
                }
                if expense_data.approved_at.is_none() {
                    return Err("Approved expenses must have approved_at timestamp".to_string());
                }
                
                // Validate approver is not the same as recorder (no self-approval)
                if let Some(ref approver) = expense_data.approved_by {
                    if approver == &expense_data.recorded_by {
                        return Err("Users cannot approve their own expenses".to_string());
                    }
                }
                
                // Validate approval timestamp is reasonable
                if let Some(approved_at) = expense_data.approved_at {
                    validate_approval_timestamp(approved_at, expense_data.created_at)?;
                }
                
                // High-value approval validation
                validate_high_value_approval_requirements(expense_data)?;
            },
            "rejected" => {
                // Rejected expenses must have rejection reason
                if expense_data.notes.is_none() || expense_data.notes.as_ref().unwrap().trim().is_empty() {
                    return Err("Rejected expenses must include rejection reason in notes".to_string());
                }
                
                // Rejected expenses should not have approved_at
                if expense_data.approved_at.is_some() {
                    return Err("Rejected expenses cannot have approved_at timestamp".to_string());
                }
                
                // Validate rejection reason is substantial
                if let Some(ref notes) = expense_data.notes {
                    if notes.len() < 10 {
                        return Err("Rejection reason must be at least 10 characters".to_string());
                    }
                }
            },
            "paid" => {
                // Paid expenses must have been approved first
                if expense_data.approved_by.is_none() || expense_data.approved_at.is_none() {
                    return Err("Paid expenses must have been approved first".to_string());
                }
                
                // Validate payment method for paid expenses
                validate_paid_expense_requirements(expense_data)?;
            },
            _ => {
                return Err(format!("Invalid expense status: '{}'", expense_data.status));
            }
        }
        
        Ok(())
    }

    pub fn validate_expense_category_document(context: &AssertSetDocContext) -> Result<(), String> {
        let category_data: ExpenseCategoryData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid expense category data format: {}", e))?;

        // Validate name format (following production username pattern)
        if !is_valid_category_name(&category_data.name) {
            return Err("Category name must be 3-100 characters and contain only letters, numbers, spaces, and basic punctuation".to_string());
        }

        // Check category name uniqueness (following production uniqueness pattern)
        let search_pattern = format!("name={};", category_data.name.to_lowercase());
        let existing_categories = list_docs(
            String::from("expense_categories"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );

        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing_categories.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            return Err(format!("Category name '{}' is already taken", category_data.name));
        }

        // Validate description length (following production pattern)
        if let Some(ref desc) = category_data.description {
            if desc.len() > 1000 {
                return Err(format!(
                    "Category description cannot exceed 1000 characters (current length: {})",
                    desc.len()
                ));
            }
        }

        // Validate budget code format if provided
        if let Some(ref code) = category_data.budget_code {
            if !code.trim().is_empty() && !is_valid_budget_code(code) {
                return Err("Budget code must be in format: XXX-000 (e.g., ADM-001)".to_string());
            }
        }

        Ok(())
    }

    pub fn validate_student_document(context: &AssertSetDocContext) -> Result<(), String> {
        let student_data: StudentData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid student data format: {}", e))?;

        // Validate required fields
        if student_data.surname.trim().is_empty() {
            return Err("Student surname is required".to_string());
        }
        if student_data.firstname.trim().is_empty() {
            return Err("Student firstname is required".to_string());
        }
        if student_data.student_id.trim().is_empty() {
            return Err("Student ID is required".to_string());
        }

        // Check student ID uniqueness (following production uniqueness pattern)
        let search_pattern = format!("student_id={};", student_data.student_id);
        let existing_students = list_docs(
            String::from("students"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );

        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing_students.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            return Err(format!("Student ID '{}' is already taken", student_data.student_id));
        }

        // Validate gender (following production enum pattern)
        let valid_genders = ["male", "female", "other"];
        if !valid_genders.contains(&student_data.gender.as_str()) {
            return Err(format!(
                "Invalid gender '{}'. Must be one of: {}",
                student_data.gender,
                valid_genders.join(", ")
            ));
        }

        // Validate dates
        if !is_valid_date_format(&student_data.date_of_birth) {
            return Err("Invalid date of birth format. Must be YYYY-MM-DD".to_string());
        }
        if !is_valid_date_format(&student_data.admission_date) {
            return Err("Invalid admission date format. Must be YYYY-MM-DD".to_string());
        }

        // Validate guardian phone
        if !is_valid_phone_number(&student_data.guardian_phone) {
            return Err("Invalid guardian phone number format".to_string());
        }

        // Validate guardian email if provided
        if let Some(ref email) = student_data.guardian_email {
            if !email.trim().is_empty() && !is_valid_email(email) {
                return Err("Invalid guardian email format".to_string());
            }
        }

        Ok(())
    }

    // COMPREHENSIVE PAYMENT VALIDATION
    pub fn validate_payment_document(context: &AssertSetDocContext) -> Result<(), String> {
        let payment_data: PaymentData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid payment data format: {}", e))?;

        // Core payment validation
        validate_payment_core_fields(&payment_data)?;
        validate_payment_amounts(&payment_data)?;
        validate_payment_dates(&payment_data)?;
        validate_payment_method_constraints(&payment_data)?;
        validate_payment_status_transitions(context, &payment_data)?;
        validate_payment_allocations(&payment_data)?;
        validate_payment_reference_uniqueness(context, &payment_data)?;
        validate_payment_business_rules(&payment_data)?;
        validate_payment_fraud_prevention(&payment_data)?;
        validate_payment_student_verification(&payment_data)?;
        validate_payment_compliance_rules(&payment_data)?;
        
        Ok(())
    }

    // Core payment field validation
    fn validate_payment_core_fields(payment: &PaymentData) -> Result<(), String> {
        // Student information
        if payment.student_id.trim().is_empty() {
            return Err("Student ID is required for payment".to_string());
        }
        
        if payment.student_name.trim().is_empty() {
            return Err("Student name is required for payment".to_string());
        }
        
        if payment.student_name.len() > 100 {
            return Err(format!(
                "Student name cannot exceed 100 characters (current: {})",
                payment.student_name.len()
            ));
        }
        
        // Class information
        if payment.class_id.trim().is_empty() {
            return Err("Class ID is required for payment".to_string());
        }
        
        if payment.class_name.trim().is_empty() {
            return Err("Class name is required for payment".to_string());
        }
        
        // Fee assignment
        if payment.fee_assignment_id.trim().is_empty() {
            return Err("Fee assignment ID is required for payment".to_string());
        }
        
        // Recorded by
        if payment.recorded_by.trim().is_empty() {
            return Err("Payment must specify who recorded it".to_string());
        }
        
        Ok(())
    }

    // Amount validation with precision and limits
    fn validate_payment_amounts(payment: &PaymentData) -> Result<(), String> {
        // Basic amount validation
        if payment.amount <= 0.0 {
            return Err("Payment amount must be greater than zero".to_string());
        }
        
        // Maximum payment amount (₦50M for school fees)
        if payment.amount > 50_000_000.0 {
            return Err("Payment amount cannot exceed ₦50,000,000".to_string());
        }
        
        // Minimum payment amount (₦100)
        if payment.amount < 100.0 {
            return Err("Payment amount cannot be less than ₦100".to_string());
        }
        
        // Validate decimal precision (max 2 decimal places)
        let amount_str = format!("{:.2}", payment.amount);
        let parsed_amount: f64 = amount_str.parse().unwrap_or(0.0);
        if (payment.amount - parsed_amount).abs() > 0.001 {
            return Err("Payment amount cannot have more than 2 decimal places".to_string());
        }
        
        // Validate fee allocation amounts
        for (i, allocation) in payment.fee_allocations.iter().enumerate() {
            if allocation.amount <= 0.0 {
                return Err(format!(
                    "Fee allocation {} amount must be greater than zero",
                    i + 1
                ));
            }
            
            if allocation.amount > payment.amount {
                return Err(format!(
                    "Fee allocation {} amount (₦{:.2}) cannot exceed payment amount (₦{:.2})",
                    i + 1, allocation.amount, payment.amount
                ));
            }
        }
        
        Ok(())
    }

    // Payment date validation
    fn validate_payment_dates(payment: &PaymentData) -> Result<(), String> {
        // Validate payment date format
        if !is_valid_date_format(&payment.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
        }
        
        // Payment date cannot be more than 30 days in the future
        if is_date_too_far_in_future_30_days(&payment.payment_date) {
            return Err("Payment date cannot be more than 30 days in the future".to_string());
        }
        
        // Payment date cannot be more than 2 years in the past
        if is_date_too_old_2_years(&payment.payment_date) {
            return Err("Payment date cannot be more than 2 years in the past".to_string());
        }
        
        Ok(())
    }

    // Payment method constraints based on amount
    fn validate_payment_method_constraints(payment: &PaymentData) -> Result<(), String> {
        let valid_methods = ["cash", "bank_transfer", "pos", "online", "cheque"];
        if !valid_methods.contains(&payment.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                payment.payment_method,
                valid_methods.join(", ")
            ));
        }
        
        match payment.payment_method.as_str() {
            "cash" => {
                // Cash payments limited to ₦500,000
                if payment.amount > 500_000.0 {
                    return Err("Cash payments cannot exceed ₦500,000 for audit compliance".to_string());
                }
            },
            "pos" => {
                // POS payments limited to ₦2,000,000
                if payment.amount > 2_000_000.0 {
                    return Err("POS payments cannot exceed ₦2,000,000".to_string());
                }
            },
            "cheque" => {
                // Cheque payments must have transaction ID
                if payment.transaction_id.is_none() || 
                   payment.transaction_id.as_ref().unwrap().trim().is_empty() {
                    return Err("Cheque payments must include cheque number as transaction ID".to_string());
                }
            },
            "online" => {
                // Online payments must have transaction ID
                if payment.transaction_id.is_none() || 
                   payment.transaction_id.as_ref().unwrap().trim().is_empty() {
                    return Err("Online payments must include transaction reference as transaction ID".to_string());
                }
            },
            "bank_transfer" => {
                // Bank transfers over ₦1M should have transaction ID
                if payment.amount > 1_000_000.0 && 
                   (payment.transaction_id.is_none() || 
                    payment.transaction_id.as_ref().unwrap().trim().is_empty()) {
                    return Err("Bank transfers over ₦1,000,000 should include transaction reference".to_string());
                }
            },
            _ => {}
        }
        
        Ok(())
    }

    // Payment status transitions
    fn validate_payment_status_transitions(
        context: &AssertSetDocContext,
        payment: &PaymentData
    ) -> Result<(), String> {
        let valid_statuses = ["pending", "confirmed", "cancelled", "refunded"];
        if !valid_statuses.contains(&payment.status.as_str()) {
            return Err(format!(
                "Invalid payment status '{}'. Must be one of: {}",
                payment.status,
                valid_statuses.join(", ")
            ));
        }
        
        // Check status transitions for updates
        if let Some(ref before_doc) = context.data.data.before {
            let before_payment: PaymentData = decode_doc_data(&before_doc.data)
                .map_err(|e| format!("Invalid previous payment data: {}", e))?;
            
            let valid_transitions = HashMap::from([
                ("pending", vec!["confirmed", "cancelled"]),
                ("confirmed", vec!["refunded"]),
                ("cancelled", vec![]), // No transitions from cancelled
                ("refunded", vec![]),  // No transitions from refunded
            ]);
            
            let current_status = &before_payment.status;
            let new_status = &payment.status;
            
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
            match new_status.as_str() {
                "cancelled" => {
                    if payment.notes.is_none() || payment.notes.as_ref().unwrap().trim().is_empty() {
                        return Err("Cancelled payments must include cancellation reason in notes".to_string());
                    }
                },
                "refunded" => {
                    if payment.notes.is_none() || payment.notes.as_ref().unwrap().trim().is_empty() {
                        return Err("Refunded payments must include refund reason in notes".to_string());
                    }
                },
                _ => {}
            }
        } else {
            // New payments should typically start as "pending" but can be "confirmed" for immediate confirmation
            if !vec!["pending", "confirmed"].contains(&payment.status.as_str()) {
                return Err("New payments must have status 'pending' or 'confirmed'".to_string());
            }
        }
        
        Ok(())
    }

    // Fee allocation validation
    fn validate_payment_allocations(payment: &PaymentData) -> Result<(), String> {
        if payment.fee_allocations.is_empty() {
            return Err("Payment must have at least one fee allocation".to_string());
        }
        
        if payment.fee_allocations.len() > 20 {
            return Err("Payment cannot have more than 20 fee allocations".to_string());
        }
        
        // Validate total allocation matches payment amount
        let total_allocated: f64 = payment.fee_allocations.iter()
            .map(|alloc| alloc.amount)
            .sum();
        
        if (payment.amount - total_allocated).abs() > 0.01 {
            return Err(format!(
                "Payment amount (₦{:.2}) must match sum of fee allocations (₦{:.2})",
                payment.amount, total_allocated
            ));
        }
        
        // Validate individual allocations
        let mut fee_types = std::collections::HashSet::new();
        for (i, allocation) in payment.fee_allocations.iter().enumerate() {
            // Validate allocation fields
            if allocation.category_id.trim().is_empty() {
                return Err(format!("Fee allocation {} must have a category ID", i + 1));
            }
            
            if allocation.category_name.trim().is_empty() {
                return Err(format!("Fee allocation {} must have a category name", i + 1));
            }
            
            if allocation.fee_type.trim().is_empty() {
                return Err(format!("Fee allocation {} must have a fee type", i + 1));
            }
            
            // Validate fee type
            let valid_fee_types = [
                "tuition", "uniform", "feeding", "transport", "books",
                "sports", "development", "examination", "pta", "computer",
                "library", "laboratory", "lesson", "other"
            ];
            
            if !valid_fee_types.contains(&allocation.fee_type.as_str()) {
                return Err(format!(
                    "Invalid fee type '{}' in allocation {}. Must be one of: {}",
                    allocation.fee_type, i + 1, valid_fee_types.join(", ")
                ));
            }
            
            fee_types.insert(allocation.fee_type.clone());
        }
        
        Ok(())
    }

    // Payment reference uniqueness
    fn validate_payment_reference_uniqueness(
        context: &AssertSetDocContext,
        payment: &PaymentData
    ) -> Result<(), String> {
        // Validate reference format
        if !payment.reference.starts_with("PAY-") {
            return Err("Payment reference must start with 'PAY-'".to_string());
        }
        
        if !is_valid_payment_reference(&payment.reference) {
            return Err("Payment reference must follow format: PAY-YYYY-XXXXXXXX".to_string());
        }
        
        // Check reference uniqueness
        let search_pattern = format!("reference={};", payment.reference);
        let existing = list_docs(
            String::from("payments"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );
        
        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Payment reference '{}' already exists", payment.reference));
        }
        
        Ok(())
    }

    // Business rule validation
    fn validate_payment_business_rules(payment: &PaymentData) -> Result<(), String> {
        // Large payment validation (over ₦1M)
        if payment.amount > 1_000_000.0 {
            // Should have paid_by information for large payments
            if payment.paid_by.is_none() || payment.paid_by.as_ref().unwrap().trim().is_empty() {
                return Err("Payments over ₦1,000,000 should specify who made the payment".to_string());
            }
        }
        
        // Very large payment validation (over ₦5M)
        if payment.amount > 5_000_000.0 {
            // Must have notes explaining the large payment
            if payment.notes.is_none() || payment.notes.as_ref().unwrap().trim().is_empty() {
                return Err("Payments over ₦5,000,000 must include explanatory notes".to_string());
            }
            
            // Must have transaction ID for audit trail
            if payment.transaction_id.is_none() || payment.transaction_id.as_ref().unwrap().trim().is_empty() {
                return Err("Payments over ₦5,000,000 must include transaction reference".to_string());
            }
        }
        
        // Weekend payment rules (if payment date falls on weekend)
        if is_weekend(&payment.payment_date) && payment.amount > 100_000.0 {
            // Weekend payments over ₦100K should have notes
            if payment.notes.is_none() || payment.notes.as_ref().unwrap().trim().is_empty() {
                return Err("Weekend payments over ₦100,000 should include explanatory notes".to_string());
            }
        }
        
        Ok(())
    }

    // Fraud prevention validation
    fn validate_payment_fraud_prevention(payment: &PaymentData) -> Result<(), String> {
        // Round number validation - suspicious if amount ends in many zeros
        if payment.amount >= 10_000.0 {
            let amount_str = format!("{:.0}", payment.amount);
            if amount_str.ends_with("0000") && payment.amount > 100_000.0 {
                // Very round numbers over 100K might need extra validation
                if payment.notes.is_none() || payment.notes.as_ref().unwrap().len() < 20 {
                    return Err("Large round-number payments should include detailed notes".to_string());
                }
            }
        }
        
        // Transaction ID format validation for different payment methods
        if let Some(ref tx_id) = payment.transaction_id {
            match payment.payment_method.as_str() {
                "online" => {
                    if tx_id.len() < 10 {
                        return Err("Online payment transaction ID must be at least 10 characters".to_string());
                    }
                },
                "cheque" => {
                    if !tx_id.chars().all(|c| c.is_numeric()) || tx_id.len() < 6 {
                        return Err("Cheque number must be at least 6 digits".to_string());
                    }
                },
                _ => {}
            }
        }
        
        Ok(())
    }

    // Student verification
    fn validate_payment_student_verification(payment: &PaymentData) -> Result<(), String> {
        // Verify student exists (simplified - would query students collection)
        if payment.student_id.len() < 3 {
            return Err("Student ID must be at least 3 characters".to_string());
        }
        
        // Validate student name format
        if !payment.student_name.chars().any(|c| c.is_alphabetic()) {
            return Err("Student name must contain at least one letter".to_string());
        }
        
        // Validate class information
        if payment.class_id.len() < 2 {
            return Err("Class ID must be at least 2 characters".to_string());
        }
        
        if payment.class_name.len() < 2 {
            return Err("Class name must be at least 2 characters".to_string());
        }
        
        Ok(())
    }

    // Compliance rules
    fn validate_payment_compliance_rules(payment: &PaymentData) -> Result<(), String> {
        // Receipt URL validation if provided
        if let Some(ref receipt_url) = payment.receipt_url {
            if !receipt_url.trim().is_empty() && !is_valid_url(receipt_url) {
                return Err("Invalid receipt URL format".to_string());
            }
        }
        
        // Notes length validation
        if let Some(ref notes) = payment.notes {
            if notes.len() > 1000 {
                return Err(format!(
                    "Payment notes cannot exceed 1000 characters (current: {})",
                    notes.len()
                ));
            }
        }
        
        // Paid by validation
        if let Some(ref paid_by) = payment.paid_by {
            if paid_by.len() > 100 {
                return Err("Paid by field cannot exceed 100 characters".to_string());
            }
        }
        
        Ok(())
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
        validate_salary_business_rules(&salary_data)?;
        
        Ok(())
    }

    // Staff core field validation
    fn validate_staff_core_fields(staff: &StaffMemberData) -> Result<(), String> {
        // Name validation
        if staff.surname.trim().is_empty() {
            return Err("Staff surname is required".to_string());
        }
        
        if staff.firstname.trim().is_empty() {
            return Err("Staff firstname is required".to_string());
        }
        
        if staff.surname.len() > 50 {
            return Err(format!(
                "Staff surname cannot exceed 50 characters (current: {})",
                staff.surname.len()
            ));
        }
        
        if staff.firstname.len() > 50 {
            return Err(format!(
                "Staff firstname cannot exceed 50 characters (current: {})",
                staff.firstname.len()
            ));
        }
        
        // Validate middle name if provided
        if let Some(ref middlename) = staff.middlename {
            if middlename.len() > 50 {
                return Err(format!(
                    "Staff middlename cannot exceed 50 characters (current: {})",
                    middlename.len()
                ));
            }
        }
        
        // Staff number validation
        if staff.staff_number.trim().is_empty() {
            return Err("Staff number is required".to_string());
        }
        
        if staff.staff_number.len() < 3 || staff.staff_number.len() > 20 {
            return Err("Staff number must be between 3 and 20 characters".to_string());
        }
        
        // Position validation
        if staff.position.trim().is_empty() {
            return Err("Staff position is required".to_string());
        }
        
        if staff.position.len() > 100 {
            return Err(format!(
                "Staff position cannot exceed 100 characters (current: {})",
                staff.position.len()
            ));
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
        // Basic salary validation
        if staff.basic_salary <= 0.0 {
            return Err("Basic salary must be greater than zero".to_string());
        }
        
        // Minimum wage validation (₦30,000 per month)
        if staff.basic_salary < 30_000.0 {
            return Err("Basic salary cannot be below minimum wage of ₦30,000".to_string());
        }
        
        // Maximum salary validation (₦10M per month)
        if staff.basic_salary > 10_000_000.0 {
            return Err("Basic salary cannot exceed ₦10,000,000 per month".to_string());
        }
        
        // Salary precision validation (no more than 2 decimal places)
        let salary_str = format!("{:.2}", staff.basic_salary);
        let parsed_salary: f64 = salary_str.parse().unwrap_or(0.0);
        if (staff.basic_salary - parsed_salary).abs() > 0.001 {
            return Err("Basic salary cannot have more than 2 decimal places".to_string());
        }
        
        // Validate allowances if provided
        if let Some(ref allowances) = staff.allowances {
            if allowances.len() > 20 {
                return Err("Staff cannot have more than 20 allowances".to_string());
            }
            
            let mut total_allowances = 0.0;
            let mut allowance_names = std::collections::HashSet::new();
            
            for (i, allowance) in allowances.iter().enumerate() {
                // Allowance name validation
                if allowance.name.trim().is_empty() {
                    return Err(format!("Allowance {} name is required", i + 1));
                }
                
                if allowance.name.len() > 50 {
                    return Err(format!(
                        "Allowance {} name cannot exceed 50 characters (current: {})",
                        i + 1, allowance.name.len()
                    ));
                }
                
                // Check for duplicate allowance names
                if allowance_names.contains(&allowance.name) {
                    return Err(format!("Duplicate allowance name: '{}'", allowance.name));
                }
                allowance_names.insert(allowance.name.clone());
                
                // Allowance amount validation
                if allowance.amount <= 0.0 {
                    return Err(format!("Allowance {} amount must be greater than zero", i + 1));
                }
                
                if allowance.amount > 1_000_000.0 {
                    return Err(format!(
                        "Allowance {} amount cannot exceed ₦1,000,000", 
                        i + 1
                    ));
                }
                
                total_allowances += allowance.amount;
            }
            
            // Total allowances should not exceed basic salary by more than 200%
            if total_allowances > staff.basic_salary * 2.0 {
                return Err("Total allowances cannot exceed 200% of basic salary".to_string());
            }
        }
        
        Ok(())
    }

    // Contact information validation
    fn validate_staff_contact_information(staff: &StaffMemberData) -> Result<(), String> {
        // Phone number validation
        if !is_valid_phone_number(&staff.phone) {
            return Err("Invalid phone number format".to_string());
        }
        
        // Email validation if provided
        if let Some(ref email) = staff.email {
            if !email.trim().is_empty() && !is_valid_email(email) {
                return Err("Invalid email format".to_string());
            }
        }
        
        // Address validation if provided
        if let Some(ref address) = staff.address {
            if address.len() > 200 {
                return Err(format!(
                    "Address cannot exceed 200 characters (current: {})",
                    address.len()
                ));
            }
        }
        
        Ok(())
    }

    // Banking details validation
    fn validate_staff_banking_details(staff: &StaffMemberData) -> Result<(), String> {
        // If bank name is provided, account number must also be provided
        let has_bank_name = staff.bank_name.as_ref().map_or(false, |b| !b.trim().is_empty());
        let has_account_number = staff.account_number.as_ref().map_or(false, |a| !a.trim().is_empty());
        
        if has_bank_name && !has_account_number {
            return Err("Account number is required when bank name is provided".to_string());
        }
        
        if has_account_number && !has_bank_name {
            return Err("Bank name is required when account number is provided".to_string());
        }
        
        // Bank name validation
        if let Some(ref bank_name) = staff.bank_name {
            if !bank_name.trim().is_empty() {
                if bank_name.len() < 3 || bank_name.len() > 50 {
                    return Err("Bank name must be between 3 and 50 characters".to_string());
                }
            }
        }
        
        // Account number validation
        if let Some(ref account_number) = staff.account_number {
            if !account_number.trim().is_empty() {
                if !is_valid_account_number(account_number) {
                    return Err("Invalid account number format. Must be 10 digits".to_string());
                }
            }
        }
        
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
        
        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Staff number '{}' already exists", staff.staff_number));
        }
        
        Ok(())
    }

    // Staff business rules validation
    fn validate_staff_business_rules(staff: &StaffMemberData) -> Result<(), String> {
        // Contract staff validation
        if staff.employment_type == "contract" {
            // Contract staff should have lower basic salary limits
            if staff.basic_salary > 5_000_000.0 {
                return Err("Contract staff basic salary cannot exceed ₦5,000,000 per month".to_string());
            }
        }
        
        // Part-time staff validation
        if staff.employment_type == "part-time" {
            if staff.basic_salary > 3_000_000.0 {
                return Err("Part-time staff basic salary cannot exceed ₦3,000,000 per month".to_string());
            }
        }
        
        // High salary positions validation
        if staff.basic_salary > 1_000_000.0 {
            // High salary positions should have department specified
            if staff.department.is_none() || staff.department.as_ref().unwrap().trim().is_empty() {
                return Err("Staff with salary over ₦1,000,000 must have department specified".to_string());
            }
        }
        
        // Very high salary positions (over ₦5M) need banking details
        if staff.basic_salary > 5_000_000.0 {
            if staff.bank_name.is_none() || staff.account_number.is_none() {
                return Err("Staff with salary over ₦5,000,000 must have banking details".to_string());
            }
        }
        
        Ok(())
    }

    // Salary payment validation functions
    fn validate_salary_core_fields(salary: &SalaryPaymentData) -> Result<(), String> {
        // Staff information validation
        if salary.staff_id.trim().is_empty() {
            return Err("Staff ID is required for salary payment".to_string());
        }
        
        if salary.staff_name.trim().is_empty() {
            return Err("Staff name is required for salary payment".to_string());
        }
        
        if salary.staff_number.trim().is_empty() {
            return Err("Staff number is required for salary payment".to_string());
        }
        
        if salary.recorded_by.trim().is_empty() {
            return Err("Salary payment must specify who recorded it".to_string());
        }
        
        Ok(())
    }

    fn validate_salary_amounts_and_calculations(salary: &SalaryPaymentData) -> Result<(), String> {
        // Basic salary validation
        if salary.basic_salary <= 0.0 {
            return Err("Basic salary must be greater than zero".to_string());
        }
        
        if salary.basic_salary > 10_000_000.0 {
            return Err("Basic salary cannot exceed ₦10,000,000".to_string());
        }
        
        // Validate allowances
        if salary.allowances.len() > 20 {
            return Err("Salary payment cannot have more than 20 allowances".to_string());
        }
        
        let mut calculated_allowances_total = 0.0;
        let mut allowance_names = std::collections::HashSet::new();
        
        for (i, allowance) in salary.allowances.iter().enumerate() {
            if allowance.name.trim().is_empty() {
                return Err(format!("Allowance {} name is required", i + 1));
            }
            
            if allowance.amount <= 0.0 {
                return Err(format!("Allowance {} amount must be greater than zero", i + 1));
            }
            
            if allowance_names.contains(&allowance.name) {
                return Err(format!("Duplicate allowance name: '{}'", allowance.name));
            }
            allowance_names.insert(allowance.name.clone());
            
            calculated_allowances_total += allowance.amount;
        }
        
        // Validate deductions
        if salary.deductions.len() > 20 {
            return Err("Salary payment cannot have more than 20 deductions".to_string());
        }
        
        let mut calculated_deductions_total = 0.0;
        let mut deduction_names = std::collections::HashSet::new();
        
        for (i, deduction) in salary.deductions.iter().enumerate() {
            if deduction.name.trim().is_empty() {
                return Err(format!("Deduction {} name is required", i + 1));
            }
            
            if deduction.amount <= 0.0 {
                return Err(format!("Deduction {} amount must be greater than zero", i + 1));
            }
            
            if deduction_names.contains(&deduction.name) {
                return Err(format!("Duplicate deduction name: '{}'", deduction.name));
            }
            deduction_names.insert(deduction.name.clone());
            
            calculated_deductions_total += deduction.amount;
        }
        
        // Validate calculated totals
        let expected_gross = salary.basic_salary + calculated_allowances_total;
        if (salary.total_gross - expected_gross).abs() > 0.01 {
            return Err(format!(
                "Total gross (₦{:.2}) doesn't match basic salary + allowances (₦{:.2})",
                salary.total_gross, expected_gross
            ));
        }
        
        if (salary.total_deductions - calculated_deductions_total).abs() > 0.01 {
            return Err(format!(
                "Total deductions (₦{:.2}) doesn't match sum of deductions (₦{:.2})",
                salary.total_deductions, calculated_deductions_total
            ));
        }
        
        let expected_net_pay = salary.total_gross - salary.total_deductions;
        if (salary.net_pay - expected_net_pay).abs() > 0.01 {
            return Err(format!(
                "Net pay (₦{:.2}) doesn't match gross - deductions (₦{:.2})",
                salary.net_pay, expected_net_pay
            ));
        }
        
        // Net pay should not be negative
        if salary.net_pay < 0.0 {
            return Err("Net pay cannot be negative (deductions exceed gross pay)".to_string());
        }
        
        // Net pay should not be more than ₦15M (sanity check)
        if salary.net_pay > 15_000_000.0 {
            return Err("Net pay cannot exceed ₦15,000,000 (sanity check)".to_string());
        }
        
        Ok(())
    }

    fn validate_salary_payment_period(salary: &SalaryPaymentData) -> Result<(), String> {
        // Month validation
        let month_num: u32 = salary.month.parse().unwrap_or(0);
        if month_num < 1 || month_num > 12 {
            return Err("Month must be between 01 and 12".to_string());
        }
        
        // Year validation
        let year_num: u32 = salary.year.parse().unwrap_or(0);
        if year_num < 2020 || year_num > 2050 {
            return Err("Year must be between 2020 and 2050".to_string());
        }
        
        // Payment date validation
        if !is_valid_date_format(&salary.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
        }
        
        // Payment date should not be too far in future
        if is_date_too_far_in_future_30_days(&salary.payment_date) {
            return Err("Payment date cannot be more than 30 days in the future".to_string());
        }
        
        Ok(())
    }

    fn validate_salary_payment_method(salary: &SalaryPaymentData) -> Result<(), String> {
        let valid_methods = ["bank_transfer", "cash", "cheque"];
        if !valid_methods.contains(&salary.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                salary.payment_method,
                valid_methods.join(", ")
            ));
        }
        
        // Cash payment limits for salaries
        if salary.payment_method == "cash" {
            if salary.net_pay > 100_000.0 {
                return Err("Cash salary payments cannot exceed ₦100,000 (use bank transfer)".to_string());
            }
        }
        
        // High salary payments should use bank transfer
        if salary.net_pay > 500_000.0 && salary.payment_method != "bank_transfer" {
            return Err("Salary payments over ₦500,000 must use bank transfer".to_string());
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
        if let Some(ref before_doc) = context.data.data.before {
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
            if new_status == "approved" && salary.approved_by.is_none() {
                return Err("Approved salary payments must have approved_by field set".to_string());
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
        
        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Salary reference '{}' already exists", salary.reference));
        }
        
        Ok(())
    }

    fn validate_salary_business_rules(salary: &SalaryPaymentData) -> Result<(), String> {
        // Check for duplicate salary payment for same staff in same month
        let search_pattern = format!(
            "staff_id={}*month={}*year={}*status=paid;", 
            salary.staff_id, salary.month, salary.year
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
        
        // If there are existing paid payments for this staff/month/year, prevent new ones
        for (doc_key, _) in existing_payments.items {
            // Allow if this is an update to the same document
            if Some(doc_key.clone()) == context.data.key.as_ref().map(|k| k.clone()) {
                continue;
            }
            
            return Err(format!(
                "Staff {} already has a paid salary for {}/{}", 
                salary.staff_number, salary.month, salary.year
            ));
        }
        
        // High salary validation (over ₦1M net)
        if salary.net_pay > 1_000_000.0 {
            if salary.approved_by.is_none() {
                return Err("Salary payments over ₦1,000,000 must be approved before payment".to_string());
            }
        }
        
        Ok(())
    }

    fn validate_expense_status_transition(
        context: &AssertSetDocContext, 
        proposed: &ExpenseData
    ) -> Result<(), String> {
        if let Some(ref before_doc) = context.data.data.before {
            let before_data: ExpenseData = decode_doc_data(&before_doc.data)
                .map_err(|e| format!("Invalid previous expense data: {}", e))?;

            let valid_transitions = HashMap::from([
                ("pending", vec!["approved", "rejected"]),
                ("approved", vec!["paid"]),
                ("rejected", vec![]),
                ("paid", vec![]),
            ]);

            let current_status = &before_data.status;
            let new_status = &proposed.status;

            if current_status != new_status {
                if let Some(allowed_next_states) = valid_transitions.get(current_status.as_str()) {
                    if !allowed_next_states.contains(&new_status.as_str()) {
                        return Err(format!(
                            "Invalid status transition from '{}' to '{}'. Allowed transitions: [{}]",
                            current_status,
                            new_status,
                            allowed_next_states.join(", ")
                        ));
                    }
                } else {
                    return Err(format!("Unknown current status: '{}'", current_status));
                }
            }

            // Additional validation for specific status changes
            match new_status.as_str() {
                "approved" => {
                    if proposed.approved_by.is_none() {
                        return Err("Approved expenses must have approved_by field set".to_string());
                    }
                    if proposed.approved_at.is_none() {
                        return Err("Approved expenses must have approved_at timestamp".to_string());
                    }
                },
                "rejected" => {
                    if proposed.notes.is_none() || proposed.notes.as_ref().unwrap().trim().is_empty() {
                        return Err("Rejected expenses must include rejection reason in notes".to_string());
                    }
                },
                _ => {}
            }
        } else {
            // New expense must start as pending
            if proposed.status != "pending" {
                return Err("New expenses must have status 'pending'".to_string());
            }
        }

        Ok(())
    }

    fn validate_expense_category_exists(category_id: &str) -> Result<(), String> {
        let params = ListParams {
            matcher: Some(ListMatcher {
                key: Some(category_id.to_string()),
                ..Default::default()
            }),
            ..Default::default()
        };

        let categories = list_docs(String::from("expense_categories"), params);
        if categories.items.is_empty() {
            return Err(format!("Expense category '{}' not found", category_id));
        }
        Ok(())
    }

    // Enhanced validation helper functions for expense approval
    fn validate_expense_reference_uniqueness(context: &AssertSetDocContext, reference: &str) -> Result<(), String> {
        let search_pattern = format!("reference={};", reference);
        let existing_expenses = list_docs(
            String::from("expenses"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );

        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in existing_expenses.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            return Err(format!("Expense reference '{}' already exists", reference));
        }
        Ok(())
    }

    fn validate_potential_duplicate_expense(context: &AssertSetDocContext, expense_data: &ExpenseData, vendor: &str) -> Result<(), String> {
        // Check for potential duplicate: same vendor, same amount, same date
        let search_pattern = format!("vendor_name={}*amount={}*payment_date={};", 
            vendor.to_lowercase(), expense_data.amount, expense_data.payment_date);
        
        let similar_expenses = list_docs(
            String::from("expenses"),
            ListParams {
                matcher: Some(ListMatcher {
                    description: Some(search_pattern),
                    ..Default::default()
                }),
                ..Default::default()
            },
        );

        let is_update = context.data.data.before.is_some();
        for (doc_key, _) in similar_expenses.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            return Err(format!(
                "Potential duplicate expense: Same vendor '{}', amount ₦{}, and date {} already exists",
                vendor, expense_data.amount, expense_data.payment_date
            ));
        }
        Ok(())
    }

    fn validate_category_specific_rules(expense_data: &ExpenseData) -> Result<(), String> {
        match expense_data.category.as_str() {
            "salaries" | "allowances" | "bonuses" => {
                // Staff-related expenses require detailed purpose
                if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().trim().is_empty() {
                    return Err("Staff-related expenses must include a detailed purpose".to_string());
                }
            },
            "utilities" => {
                // Utility expenses should have vendor information
                if expense_data.vendor_name.is_none() && expense_data.amount > 5000.0 {
                    return Err("Utility expenses over ₦5,000 must include vendor name".to_string());
                }
            },
            "equipment_purchase" | "computer_equipment" => {
                // Equipment purchases require detailed documentation
                if expense_data.amount > 50_000.0 {
                    if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().len() < 20 {
                        return Err("Equipment purchases over ₦50,000 must include detailed purpose (min 20 characters)".to_string());
                    }
                    if expense_data.vendor_name.is_none() {
                        return Err("Equipment purchases over ₦50,000 must include vendor name".to_string());
                    }
                }
            },
            _ => {}
        }
        Ok(())
    }

    fn validate_weekend_holiday_rules(expense_data: &ExpenseData) -> Result<(), String> {
        // Parse date and check if it's weekend
        if let Ok(date) = parse_date(&expense_data.payment_date) {
            let weekday = get_weekday(date.0, date.1, date.2);
            
            // Weekend expenses (Saturday=6, Sunday=0) require additional justification
            if weekday == 0 || weekday == 6 {
                if expense_data.amount > 50_000.0 {
                    if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().len() < 15 {
                        return Err("Weekend expenses over ₦50,000 must include detailed justification (min 15 characters)".to_string());
                    }
                }
            }
        }
        Ok(())
    }

    fn validate_approval_timestamp(approved_at: u64, created_at: u64) -> Result<(), String> {
        // Approval timestamp should be after creation
        if approved_at <= created_at {
            return Err("Approval timestamp must be after expense creation time".to_string());
        }
        
        // Approval shouldn't be too far in the future (max 1 hour from current time)
        let current_time = ic_cdk::api::time();
        let one_hour = 3_600_000_000_000u64; // 1 hour in nanoseconds
        
        if approved_at > current_time + one_hour {
            return Err("Approval timestamp cannot be in the future".to_string());
        }
        
        Ok(())
    }

    fn validate_high_value_approval_requirements(expense_data: &ExpenseData) -> Result<(), String> {
        // Expenses over ₦5M require additional validation
        if expense_data.amount > 5_000_000.0 {
            if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().len() < 50 {
                return Err("Expenses over ₦5,000,000 must include comprehensive purpose (min 50 characters)".to_string());
            }
            
            if expense_data.vendor_name.is_none() || expense_data.vendor_name.as_ref().unwrap().len() < 5 {
                return Err("Expenses over ₦5,000,000 must include detailed vendor information".to_string());
            }
            
            if expense_data.vendor_contact.is_none() {
                return Err("Expenses over ₦5,000,000 must include vendor contact information".to_string());
            }
        }
        
        // Expenses over ₦10M require invoice documentation
        if expense_data.amount > 10_000_000.0 {
            if expense_data.invoice_url.is_none() {
                return Err("Expenses over ₦10,000,000 must include invoice documentation".to_string());
            }
        }
        
        Ok(())
    }

    fn validate_paid_expense_requirements(expense_data: &ExpenseData) -> Result<(), String> {
        // Paid expenses over ₦100K should have bank transfer or cheque for audit trail
        if expense_data.amount > 100_000.0 {
            match expense_data.payment_method.as_str() {
                "cash" => {
                    return Err("Paid expenses over ₦100,000 should use bank transfer or cheque for better audit trail".to_string());
                },
                "pos" => {
                    if expense_data.amount > 500_000.0 {
                        return Err("Paid expenses over ₦500,000 should use bank transfer or cheque for better audit trail".to_string());
                    }
                },
                _ => {}
            }
        }
        
        // High-value paid expenses require comprehensive documentation
        if expense_data.amount > 1_000_000.0 {
            if expense_data.vendor_name.is_none() {
                return Err("Paid expenses over ₦1,000,000 must include vendor name".to_string());
            }
            if expense_data.purpose.is_none() || expense_data.purpose.as_ref().unwrap().len() < 20 {
                return Err("Paid expenses over ₦1,000,000 must include detailed purpose (min 20 characters)".to_string());
            }
        }
        
        Ok(())
    }

    // Utility validation functions (following production patterns)
    fn is_valid_category_name(name: &str) -> bool {
        let len = name.len();
        len >= 3 && len <= 100 && name.chars().all(|c| {
            c.is_alphanumeric() || c.is_whitespace() || "._-'()".contains(c)
        })
    }

    fn is_valid_phone_number(phone: &str) -> bool {
        let cleaned = phone.replace(&[' ', '-', '+', '(', ')'][..], "");
        // Nigerian numbers: 070, 080, 081, 090, 091, etc.
        if cleaned.len() == 11 && cleaned.starts_with('0') {
            return cleaned.chars().all(|c| c.is_numeric());
        }
        // International format: 234...
        if cleaned.len() == 13 && cleaned.starts_with("234") {
            return cleaned.chars().all(|c| c.is_numeric());
        }
        false
    }

    fn is_valid_email(email: &str) -> bool {
        email.contains('@') && email.contains('.') && email.len() > 5
    }

    fn is_valid_date_format(date: &str) -> bool {
        if date.len() != 10 { return false; }
        let parts: Vec<&str> = date.split('-').collect();
        if parts.len() != 3 { return false; }
        
        if parts[0].len() != 4 || !parts[0].chars().all(|c| c.is_numeric()) { return false; }
        if parts[1].len() != 2 || !parts[1].chars().all(|c| c.is_numeric()) { return false; }
        if parts[2].len() != 2 || !parts[2].chars().all(|c| c.is_numeric()) { return false; }
        
        let month: u32 = parts[1].parse().unwrap_or(0);
        let day: u32 = parts[2].parse().unwrap_or(0);
        month >= 1 && month <= 12 && day >= 1 && day <= 31
    }

    fn is_valid_budget_code(code: &str) -> bool {
        if code.len() != 7 { return false; }
        let parts: Vec<&str> = code.split('-').collect();
        if parts.len() != 2 { return false; }
        
        parts[0].len() == 3 && parts[0].chars().all(|c| c.is_alphabetic()) &&
        parts[1].len() == 3 && parts[1].chars().all(|c| c.is_numeric())
    }
    
    fn is_valid_expense_reference(reference: &str) -> bool {
        // Format: EXP-YYYY-XXXXXXXX (EXP- + 4-digit year + - + 8 alphanumeric)
        if reference.len() != 17 { return false; }
        
        let parts: Vec<&str> = reference.split('-').collect();
        if parts.len() != 3 { return false; }
        
        // Check EXP prefix
        if parts[0] != "EXP" { return false; }
        
        // Check year (4 digits)
        if parts[1].len() != 4 || !parts[1].chars().all(|c| c.is_numeric()) { return false; }
        
        // Check suffix (8 alphanumeric)
        if parts[2].len() != 8 || !parts[2].chars().all(|c| c.is_alphanumeric()) { return false; }
        
        true
    }
    
    fn is_valid_url(url: &str) -> bool {
        url.starts_with("http://") || url.starts_with("https://")
    }
    
    fn is_date_too_far_in_future(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let current_time = ic_cdk::api::time();
            let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
            let seven_days = 7 * 24 * 60 * 60 * 1_000_000_000u64; // 7 days in nanoseconds
            
            date_timestamp > current_time + seven_days
        } else {
            false
        }
    }
    
    fn is_date_too_old(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let current_time = ic_cdk::api::time();
            let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
            let one_year = 365 * 24 * 60 * 60 * 1_000_000_000u64; // 1 year in nanoseconds
            
            date_timestamp < current_time - one_year
        } else {
            false
        }
    }
    
    fn parse_date(date: &str) -> Result<(u32, u32, u32), ()> {
        let parts: Vec<&str> = date.split('-').collect();
        if parts.len() != 3 { return Err(()); }
        
        let year = parts[0].parse::<u32>().map_err(|_| ())?;
        let month = parts[1].parse::<u32>().map_err(|_| ())?;
        let day = parts[2].parse::<u32>().map_err(|_| ())?;
        
        Ok((year, month, day))
    }
    
    fn date_to_timestamp(year: u32, month: u32, day: u32) -> u64 {
        // Simple timestamp calculation (approximate)
        let days_since_1970 = (year - 1970) * 365 + (month - 1) * 30 + day;
        days_since_1970 as u64 * 24 * 60 * 60 * 1_000_000_000 // Convert to nanoseconds
    }
    
    fn get_weekday(year: u32, month: u32, day: u32) -> u32 {
        // Simplified weekday calculation (Zeller's congruence approximation)
        let a = (14 - month) / 12;
        let y = year - a;
        let m = month + 12 * a - 2;
        
        (day + (13 * m - 1) / 5 + y + y / 4 - y / 100 + y / 400) % 7
    }
    
    // Additional payment-specific utility functions
    fn is_valid_payment_reference(reference: &str) -> bool {
        // Format: PAY-YYYY-XXXXXXXX (PAY- + 4-digit year + - + 8 alphanumeric)
        if reference.len() != 17 { return false; }
        
        let parts: Vec<&str> = reference.split('-').collect();
        if parts.len() != 3 { return false; }
        
        // Check PAY prefix
        if parts[0] != "PAY" { return false; }
        
        // Check year (4 digits)
        if parts[1].len() != 4 || !parts[1].chars().all(|c| c.is_numeric()) { return false; }
        
        // Check suffix (8 alphanumeric)
        if parts[2].len() != 8 || !parts[2].chars().all(|c| c.is_alphanumeric()) { return false; }
        
        true
    }
    
    fn is_date_too_far_in_future_30_days(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let current_time = ic_cdk::api::time();
            let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
            let thirty_days = 30 * 24 * 60 * 60 * 1_000_000_000u64; // 30 days in nanoseconds
            
            date_timestamp > current_time + thirty_days
        } else {
            false
        }
    }
    
    fn is_date_too_old_2_years(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let current_time = ic_cdk::api::time();
            let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
            let two_years = 2 * 365 * 24 * 60 * 60 * 1_000_000_000u64; // 2 years in nanoseconds
            
            date_timestamp < current_time - two_years
        } else {
            false
        }
    }
    
    fn is_weekend(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let weekday = get_weekday(parsed_date.0, parsed_date.1, parsed_date.2);
            weekday == 0 || weekday == 6 // Sunday=0, Saturday=6
        } else {
            false
        }
    }
    
    // Staff-specific utility functions
    fn is_employment_date_too_old(date: &str) -> bool {
        if let Ok(parsed_date) = parse_date(date) {
            let current_time = ic_cdk::api::time();
            let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
            let fifty_years = 50 * 365 * 24 * 60 * 60 * 1_000_000_000u64; // 50 years in nanoseconds
            
            date_timestamp < current_time - fifty_years
        } else {
            false
        }
    }
    
    fn is_valid_department_name(name: &str) -> bool {
        // Department names should contain only letters, numbers, spaces, and basic punctuation
        name.len() <= 50 && name.chars().all(|c| {
            c.is_alphanumeric() || c.is_whitespace() || "._-&'()".contains(c)
        })
    }
    
    fn is_valid_account_number(account: &str) -> bool {
        // Nigerian bank account numbers are typically 10 digits
        account.len() == 10 && account.chars().all(|c| c.is_numeric())
    }
    
    fn is_valid_salary_reference(reference: &str) -> bool {
        // Format: SAL-YYYY-MM-XXXXXX (SAL- + 4-digit year + - + 2-digit month + - + 6 alphanumeric)
        if reference.len() != 16 { return false; }
        
        let parts: Vec<&str> = reference.split('-').collect();
        if parts.len() != 4 { return false; }
        
        // Check SAL prefix
        if parts[0] != "SAL" { return false; }
        
        // Check year (4 digits)
        if parts[1].len() != 4 || !parts[1].chars().all(|c| c.is_numeric()) { return false; }
        
        // Check month (2 digits, 01-12)
        if parts[2].len() != 2 || !parts[2].chars().all(|c| c.is_numeric()) { return false; }
        let month: u32 = parts[2].parse().unwrap_or(0);
        if month < 1 || month > 12 { return false; }
        
        // Check suffix (6 alphanumeric)
        if parts[3].len() != 6 || !parts[3].chars().all(|c| c.is_alphanumeric()) { return false; }
        
        true
    }
}

#[assert_set_doc(collections = [
    "expenses", 
    "expense_categories", 
    "budgets", 
    "students", 
    "payments", 
    "fee_categories", 
    "fee_assignments",
    "staff",
    "salary_payments",
    "classes"
])]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    match context.data.collection.as_str() {
        "expenses" => expense_assertions::validate_expense_document(&context),
        "expense_categories" => expense_assertions::validate_expense_category_document(&context),
        "students" => expense_assertions::validate_student_document(&context),
        "payments" => expense_assertions::validate_payment_document(&context),
        "staff" => expense_assertions::validate_staff_document(&context),
        "salary_payments" => expense_assertions::validate_salary_payment_document(&context),
        "budgets" => Ok(()), // TODO: Implement budget validation
        "fee_categories" => Ok(()), // TODO: Implement fee category validation
        "fee_assignments" => Ok(()), // TODO: Implement fee assignment validation
        "classes" => Ok(()), // TODO: Implement class validation
        _ => Err(format!("Unknown collection: {}", context.data.collection))
    }
}

#[assert_delete_doc]
fn assert_delete_doc(_context: AssertDeleteDocContext) -> Result<(), String> {
    Ok(())
}

#[assert_upload_asset]
fn assert_upload_asset(_context: AssertUploadAssetContext) -> Result<(), String> {
    Ok(())
}

#[assert_delete_asset]
fn assert_delete_asset(_context: AssertDeleteAssetContext) -> Result<(), String> {
    Ok(())
}

include_satellite!();
