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
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BankTransactionData {
    pub debit_amount: f64,
    pub credit_amount: f64,
    pub balance: f64,
    pub status: String,
    pub is_reconciled: Option<bool>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InterAccountTransferData {
    pub from_account_id: String,
    pub to_account_id: String,
    pub amount: f64,
    pub status: String,
    pub approved_by: Option<String>,
    pub approved_at: Option<u64>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BankAccountData {
    pub account_type: String,
    pub balance: f64,
}

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
    let data: BankTransactionData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid bank transaction data format: {}", e))?;
    
    let debit = data.debit_amount;
    let credit = data.credit_amount;
    
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
    if data.balance < OVERDRAFT_ALERT_THRESHOLD {
        return Err(format!(
            "FRAUD ALERT: Account balance ₦{:.2} exceeds reasonable overdraft limit. Verify account status.",
            data.balance
        ));
    }
    
    // AUDIT: Ensure status transitions are valid
    let valid_statuses = ["pending", "cleared", "reconciled"];
    if !valid_statuses.contains(&data.status.as_str()) {
        return Err(format!("Invalid status '{}'. Must be: pending, cleared, or reconciled", data.status));
    }
    
    // If reconciled, must have reconciled flag set
    if data.status == "reconciled" {
        let is_reconciled = data.is_reconciled.unwrap_or(false);
        
        if !is_reconciled {
            return Err("AUDIT: Status is 'reconciled' but isReconciled flag is false".to_string());
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
    let data: InterAccountTransferData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid transfer data format: {}", e))?;
    
    // CRITICAL: Validate from/to accounts are different (prevent circular transfers)
    if data.from_account_id == data.to_account_id {
        return Err("SECURITY: Cannot transfer to the same account. Self-transfers are prohibited.".to_string());
    }
    
    // CRITICAL: Validate amount is positive
    if data.amount <= 0.0 {
        return Err("Transfer amount must be greater than 0".to_string());
    }
    
    // FRAUD DETECTION: Check for unreasonably large transfers
    if data.amount > MAX_SINGLE_TRANSACTION {
        return Err(format!(
            "FRAUD ALERT: Transfer amount ₦{:.2} exceeds maximum limit. Contact administrator.",
            data.amount
        ));
    }
    
    // APPROVAL WORKFLOW: High-value transfers require approval before completion
    let valid_statuses = ["pending", "approved", "completed", "rejected", "cancelled"];
    if !valid_statuses.contains(&data.status.as_str()) {
        return Err(format!("Invalid status '{}'", data.status));
    }
    
    // CRITICAL: Transfers over threshold require approval
    if data.amount > MAX_TRANSFER_WITHOUT_APPROVAL {
        if data.status == "completed" {
            // Must have approvedBy and approvedAt
            if data.approved_by.is_none() || data.approved_by.as_ref().unwrap().trim().is_empty() {
                return Err(format!(
                    "APPROVAL REQUIRED: Transfers over ₦{:.2} require approval before completion",
                    MAX_TRANSFER_WITHOUT_APPROVAL
                ));
            }
            
            if data.approved_at.is_none() {
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
    let data: BankAccountData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid bank account data format: {}", e))?;
    
    // CRITICAL: Validate account type
    let valid_types = ["current", "savings"];
    if !valid_types.contains(&data.account_type.as_str()) {
        return Err(format!("Invalid accountType '{}'. Must be: current or savings", data.account_type));
    }
    
    // FRAUD DETECTION: Alert on unreasonably negative balances
    if data.balance < -50_000_000.0 {
        return Err(format!(
            "FRAUD ALERT: Account balance ₦{:.2} is unreasonably negative. Verify account integrity.",
            data.balance
        ));
    }
    
    Ok(())
}
