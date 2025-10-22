use junobuild_satellite::{AssertSetDocContext, list_docs};
use junobuild_shared::types::list::{ListParams, ListMatcher};
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};
use super::utils::validation_utils::*;
use std::collections::HashMap;

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
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
#[serde(rename_all = "camelCase")]
pub struct PaymentAllocation {
    pub category_id: String,
    pub category_name: String,
    pub fee_type: String,
    pub amount: f64,
}

 pub fn validate_payment_document(context: &AssertSetDocContext) -> Result<(), String> {
        let payment_data: PaymentData = decode_doc_data(&context.data.data.proposed.data)
            .map_err(|e| format!("Invalid payment data format: {}", e))?;

        // Core payment validation (minimal on server)
        validate_payment_core_fields(&payment_data)?;
        validate_payment_dates(&payment_data)?;
        validate_payment_method_constraints(&payment_data)?;
        validate_payment_status_transitions(context, &payment_data)?;
        validate_payment_allocations(&payment_data)?;
        validate_payment_reference_uniqueness(context, &payment_data)?;
        
        Ok(())
    }

    // Core payment field validation
    fn validate_payment_core_fields(payment: &PaymentData) -> Result<(), String> {
        // Minimal checks - empty field validation moved to frontend
        if payment.amount <= 0.0 {
            return Err("Payment amount must be greater than zero".to_string());
        }
        Ok(())
    }


    // Payment date validation
    fn validate_payment_dates(payment: &PaymentData) -> Result<(), String> {
        // Only enforce date format on server
        if !is_valid_date_format(&payment.payment_date) {
            return Err("Invalid payment date format. Must be YYYY-MM-DD".to_string());
        }
        Ok(())
    }

    fn validate_payment_method_constraints(payment: &PaymentData) -> Result<(), String> {
        // Only enforce allowed enum on server
        let valid_methods = ["cash", "bank_transfer", "pos", "online", "cheque"];
        if !valid_methods.contains(&payment.payment_method.as_str()) {
            return Err(format!(
                "Invalid payment method '{}'. Must be one of: {}",
                payment.payment_method,
                valid_methods.join(", ")
            ));
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
        if let Some(ref before_doc) = context.data.data.current {
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

    // Payment reference uniqueness (core)
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
        
        let is_update = !context.data.key.is_empty();
        for (doc_key, _) in existing.items {
            if is_update && doc_key == context.data.key {
                continue;
            }
            
            return Err(format!("Payment reference '{}' already exists", payment.reference));
        }
        
        Ok(())
    }



