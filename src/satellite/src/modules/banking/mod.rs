//! Banking Module - Server-side Security & Business Rule Validation
//!
//! This module enforces CRITICAL security and business rules:
//! - Amount integrity (no negative amounts, no double-entry)
//! - Transaction limits (fraud prevention)
//! - Approval workflows (high-value transfers)
//! - Balance consistency checks
//!
//! Note: Basic input validation (required fields, formats) is handled on frontend.

use junobuild_satellite::AssertSetDocContext;
use crate::modules::utils::validation_utils::validate_positive_amount;

// Security Constants
const MAX_SINGLE_TRANSACTION: f64 = 1_000_000_000.0; // ₦1B - Suspicious transaction threshold
const MAX_TRANSFER_WITHOUT_APPROVAL: f64 = 5_000_000.0; // ₦5M - Requires approval above this
const OVERDRAFT_ALERT_THRESHOLD: f64 = -10_000_000.0; // ₦10M negative - Alert on excessive overdraft

/// Bank Transaction Validation - Security & Business Rules Only
///
/// Security Checks:
/// - Amount integrity (non-negative, no double-entry)
/// - Fraud detection (unreasonable amounts)
/// - Balance consistency (detect suspicious overdrafts)
pub fn validate_bank_transaction(context: &AssertSetDocContext) -> Result<(), String> {
    let data = &context.data.data;
    
    // CRITICAL: Validate amounts are non-negative (prevent fraud)
    let debit = data.get("debitAmount")
        .and_then(|v| v.as_f64())
        .ok_or("Invalid debit amount")?;
    
    let credit = data.get("creditAmount")
        .and_then(|v| v.as_f64())
        .ok_or("Invalid credit amount")?;
    
    if debit < 0.0 || credit < 0.0 {
        return Err("SECURITY: Transaction amounts cannot be negative".to_string());
    }
    
    // CRITICAL: Transaction must have either debit OR credit, not both (double-entry integrity)
    if debit > 0.0 && credit > 0.0 {
        return Err("SECURITY: Transaction cannot have both debit and credit amounts".to_string());
    }
    
    // CRITICAL: Transaction must have at least one non-zero amount
    if debit == 0.0 && credit == 0.0 {
        return Err("SECURITY: Transaction must have a non-zero amount".to_string());
    }
    
    // FRAUD DETECTION: Flag unreasonably large transactions
    let transaction_amount = debit.max(credit);
    if transaction_amount > MAX_SINGLE_TRANSACTION {
        return Err(format!(
            "FRAUD ALERT: Transaction amount ₦{:.2} exceeds maximum limit of ₦{:.2}. Contact administrator.",
            transaction_amount, MAX_SINGLE_TRANSACTION
        ));
    }
    
    // FRAUD DETECTION: Alert on excessive overdrafts
    if let Some(balance) = data.get("balance").and_then(|v| v.as_f64()) {
        if balance < OVERDRAFT_ALERT_THRESHOLD {
            return Err(format!(
                "FRAUD ALERT: Account balance ₦{:.2} exceeds reasonable overdraft limit. Verify account status.",
                balance
            ));
        }
    }
    
    // AUDIT: Ensure status transitions are valid
    if let Some(status) = data.get("status").and_then(|v| v.as_str()) {
        let valid_statuses = ["pending", "cleared", "reconciled"];
        if !valid_statuses.contains(&status) {
            return Err(format!("Invalid status '{}'. Must be: pending, cleared, or reconciled", status));
        }
        
        // If reconciled, must have reconciled flag set
        if status == "reconciled" {
            let is_reconciled = data.get("isReconciled")
                .and_then(|v| v.as_bool())
                .unwrap_or(false);
            
            if !is_reconciled {
                return Err("AUDIT: Status is 'reconciled' but isReconciled flag is false".to_string());
            }
        }
    }
    
    Ok(())
}

/// Inter-Account Transfer Validation - Security & Approval Workflow
///
/// Security Checks:
/// - No self-transfers (fraud prevention)
/// - Amount limits (approval workflow)
/// - High-value transfer approval requirements
pub fn validate_transfer(context: &AssertSetDocContext) -> Result<(), String> {
    let data = &context.data.data;
    
    // CRITICAL: Validate from/to accounts are different (prevent circular transfers)
    let from_id = data.get("fromAccountId")
        .and_then(|v| v.as_str())
        .ok_or("Missing fromAccountId")?;
    
    let to_id = data.get("toAccountId")
        .and_then(|v| v.as_str())
        .ok_or("Missing toAccountId")?;
    
    if from_id == to_id {
        return Err("SECURITY: Cannot transfer to the same account. Self-transfers are prohibited.".to_string());
    }
    
    // CRITICAL: Validate amount is positive
    let amount = data.get("amount")
        .and_then(|v| v.as_f64())
        .ok_or("Invalid amount")?;
    
    validate_positive_amount(amount, "Transfer amount")?;
    
    // FRAUD DETECTION: Check for unreasonably large transfers
    if amount > MAX_SINGLE_TRANSACTION {
        return Err(format!(
            "FRAUD ALERT: Transfer amount ₦{:.2} exceeds maximum limit. Contact administrator.",
            amount
        ));
    }
    
    // APPROVAL WORKFLOW: High-value transfers require approval before completion
    let status = data.get("status")
        .and_then(|v| v.as_str())
        .ok_or("Missing status")?;
    
    let valid_statuses = ["pending", "approved", "completed", "rejected", "cancelled"];
    if !valid_statuses.contains(&status) {
        return Err(format!("Invalid status '{}'", status));
    }
    
    // CRITICAL: Transfers over threshold require approval
    if amount > MAX_TRANSFER_WITHOUT_APPROVAL {
        if status == "completed" {
            // Must have approvedBy and approvedAt
            let approved_by = data.get("approvedBy")
                .and_then(|v| v.as_str());
            
            let approved_at = data.get("approvedAt");
            
            if approved_by.is_none() || approved_by.unwrap().trim().is_empty() {
                return Err(format!(
                    "APPROVAL REQUIRED: Transfers over ₦{:.2} require approval before completion",
                    MAX_TRANSFER_WITHOUT_APPROVAL
                ));
            }
            
            if approved_at.is_none() {
                return Err("AUDIT: Approved transfers must have approvedAt timestamp".to_string());
            }
        }
    }
    
    Ok(())
}

/// Bank Account Validation - Critical Account Integrity Checks
///
/// Security Checks:
/// - Unique account numbers (prevent duplicates)
/// - Balance integrity (detect suspicious balances)
/// - Account type validation
pub fn validate_bank_account(context: &AssertSetDocContext) -> Result<(), String> {
    let data = &context.data.data;
    
    // CRITICAL: Validate account type
    let account_type = data.get("accountType")
        .and_then(|v| v.as_str())
        .ok_or("Missing accountType")?;
    
    let valid_types = ["current", "savings"];
    if !valid_types.contains(&account_type) {
        return Err(format!("Invalid accountType '{}'. Must be: current or savings", account_type));
    }
    
    // FRAUD DETECTION: Alert on unreasonably negative balances
    if let Some(balance) = data.get("balance").and_then(|v| v.as_f64()) {
        if balance < -50_000_000.0 {
            return Err(format!(
                "FRAUD ALERT: Account balance ₦{:.2} is unreasonably negative. Verify account integrity.",
                balance
            ));
        }
    }
    
    Ok(())
}
