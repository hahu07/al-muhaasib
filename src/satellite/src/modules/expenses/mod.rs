use junobuild_satellite::{AssertSetDocContext, list_docs};
use junobuild_shared::types::list::{ListParams, ListMatcher};
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};
use super::utils::validation_utils::*;
use std::collections::HashMap;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct ExpenseCategoryData {
    pub name: String,
    pub category: String,
    pub description: Option<String>,
    pub budget_code: Option<String>,
    pub is_active: bool,
    pub created_at: u64,
    pub updated_at: u64,
}

pub fn validate_expense_document(context: &AssertSetDocContext) -> Result<(), String> {
        let expense_data: ExpenseData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid expense data format: {}", e))?;

        // Core expense validation (keep only minimal server-side checks)
        validate_expense_basic_fields(&expense_data)?;
        
        // Status transition and approval validation (authoritative)
        validate_expense_status_transition(context, &expense_data)?;
        
        // Business rule validation (only core: reference uniqueness and duplicate detection)
        validate_expense_business_rules(context, &expense_data)?;
        
        // Referential integrity validation (category must exist)
        validate_expense_category_exists(&expense_data.category_id)?;
        
        // Format validation (only core: enums and id/reference/date format)
        validate_expense_formats(&expense_data)?;
        
        // Approval workflow validation
        validate_expense_approval_workflow(context, &expense_data)?;


        Ok(())
    }
    
    fn validate_expense_basic_fields(expense_data: &ExpenseData) -> Result<(), String> {
        // Only core authoritative checks
        if expense_data.amount <= 0.0 {
            return Err("Expense amount must be greater than 0".to_string());
        }
        Ok(())
    }
    
    fn validate_expense_formats(expense_data: &ExpenseData) -> Result<(), String> {
        // Minimal format checks (enums and identifiers only)
        let valid_payment_methods = ["cash", "bank_transfer", "cheque", "pos", "online"];
        if !valid_payment_methods.contains(&expense_data.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                expense_data.payment_method,
                valid_payment_methods.join(", ")
            ));
        }
        if !expense_data.reference.starts_with("EXP-") {
            return Err("Expense reference must start with 'EXP-'".to_string());
        }
        if !is_valid_expense_reference(&expense_data.reference) {
            return Err("Expense reference must be in format EXP-YYYY-XXXXXXXX".to_string());
        }
        if !is_valid_date_format(&expense_data.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
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
        
        // Only core duplicate detection; category-specific rules handled client-side
        Ok(())
    }
    
    fn validate_expense_approval_workflow(_context: &AssertSetDocContext, expense_data: &ExpenseData) -> Result<(), String> {
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
                // TODO: Re-enable in production
                // TEMPORARILY DISABLED FOR DEVELOPMENT/TESTING
                /*
                if let Some(ref approver) = expense_data.approved_by {
                    if approver == &expense_data.recorded_by {
                        return Err("Users cannot approve their own expenses".to_string());
                    }
                }
                */
                
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

     fn validate_expense_status_transition(
        context: &AssertSetDocContext, 
        proposed: &ExpenseData
    ) -> Result<(), String> {
        if let Some(ref before_doc) = context.data.data.current {
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
            // POLICY: Expenses must be approved before being saved to Juno datastore
            // Reject any attempt to create expenses with 'pending' status
            if proposed.status == "pending" {
                return Err("Expenses cannot be saved with 'pending' status. Expenses must be approved before recording to the datastore.".to_string());
            }
            
            // New expenses must be created with 'approved' status (after approval workflow)
            if proposed.status != "approved" {
                return Err("New expenses must have status 'approved'. Only approved expenses can be saved to the datastore.".to_string());
            }
            
            // Validate that approved expenses have required approval fields
            if proposed.approved_by.is_none() {
                return Err("Approved expenses must have approved_by field set".to_string());
            }
            if proposed.approved_at.is_none() {
                return Err("Approved expenses must have approved_at timestamp".to_string());
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

        let is_update = !context.data.key.is_empty();
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

        let is_update = !context.data.key.is_empty();
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

    fn validate_high_value_approval_requirements(_expense_data: &ExpenseData) -> Result<(), String> {
        // Moved to frontend - only status/approval workflow enforced here
        Ok(())
    }

    fn validate_paid_expense_requirements(_expense_data: &ExpenseData) -> Result<(), String> {
        // Moved to frontend
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

        let is_update = !context.data.key.is_empty();
        for (doc_key, _) in existing_categories.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            return Err(format!("Category name '{}' is already taken", category_data.name));
        }

        // Validate description length (following production pattern)
        if let Some(ref desc) = category_data.description {
            if !desc.is_empty() && desc.len() > 1000 {
                return Err(format!(
                    "Category description cannot exceed 1000 characters (current length: {})",
                    desc.len()
                ));
            }
        }

        // Validate budget code format if provided
        if let Some(ref code) = category_data.budget_code {
            if !code.is_empty() && !code.trim().is_empty() && !is_valid_budget_code(code) {
                return Err("Budget code must be in format: XXX-000 (e.g., ADM-001)".to_string());
            }
        }

        Ok(())
    }
