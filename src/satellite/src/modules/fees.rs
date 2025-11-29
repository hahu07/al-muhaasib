//! Fee assignment and scholarship validation module

use junobuild_satellite::AssertSetDocContext;
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentFeeAssignmentData {
    pub student_id: String,
    pub student_name: String,
    pub class_id: String,
    pub fee_structure_id: String,
    pub academic_year: String,
    pub term: String,
    pub fee_items: Vec<FeeItemData>,
    pub original_amount: Option<f64>,
    pub total_amount: f64,
    pub amount_paid: f64,
    pub balance: f64,
    pub status: String,
    pub due_date: Option<String>,
    pub scholarship_id: Option<String>,
    pub scholarship_name: Option<String>,
    pub scholarship_type: Option<String>,
    pub scholarship_value: Option<f64>,
    pub discount_amount: Option<f64>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct FeeItemData {
    pub category_id: String,
    pub category_name: String,
    #[serde(rename = "type")]
    pub fee_type: String,
    pub amount: f64,
    pub amount_paid: f64,
    pub balance: f64,
    pub is_mandatory: bool,
    pub is_optional: Option<bool>,
    pub is_selected: Option<bool>,
}

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScholarshipData {
    pub name: String,
    #[serde(rename = "type")]
    pub scholarship_type: String,
    pub percentage_off: Option<f64>,
    pub fixed_amount_off: Option<f64>,
    pub applicable_to: String,
    pub class_ids: Option<Vec<String>>,
    pub student_ids: Option<Vec<String>>,
    pub start_date: String,
    pub end_date: Option<String>,
    pub status: String,
    pub created_by: String,
    pub max_beneficiaries: Option<i64>,
    pub current_beneficiaries: Option<i64>,
}

/// Validate student fee assignment document
pub fn validate_student_fee_assignment(context: &AssertSetDocContext) -> Result<(), String> {
    let data: StudentFeeAssignmentData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid fee assignment data format: {}", e))?;

    // Validate required fields
    if data.student_id.trim().is_empty() {
        return Err("studentId is required".to_string());
    }
    if data.student_name.trim().is_empty() {
        return Err("studentName is required".to_string());
    }
    if data.class_id.trim().is_empty() {
        return Err("classId is required".to_string());
    }
    if data.fee_structure_id.trim().is_empty() {
        return Err("feeStructureId is required".to_string());
    }
    if data.academic_year.trim().is_empty() {
        return Err("academicYear is required".to_string());
    }

    // Validate term value
    if !["first", "second", "third"].contains(&data.term.as_str()) {
        return Err("term must be 'first', 'second', or 'third'".to_string());
    }

    // Validate fee items
    if data.fee_items.is_empty() {
        return Err("feeItems cannot be empty".to_string());
    }

    for item in &data.fee_items {
        // Validate fee item
        if item.category_id.trim().is_empty() {
            return Err("feeItem must have categoryId".to_string());
        }

        if item.amount < 0.0 {
            return Err(format!("Fee item {} has negative amount", item.category_id));
        }

        let is_optional = item.is_optional.unwrap_or(false);

        // Validate that a fee can't be both mandatory and optional
        if item.is_mandatory && is_optional {
            return Err(format!(
                "Fee item {} cannot be both mandatory and optional",
                item.category_id
            ));
        }
    }

    // Validate amounts

    // Validate scholarship data if present
    if let Some(ref scholarship_id) = data.scholarship_id {
        if scholarship_id.trim().is_empty() {
            return Err("scholarshipId cannot be empty string".to_string());
        }

        let scholarship_type = data.scholarship_type.as_ref()
            .ok_or("scholarshipType is required when scholarshipId is present")?;

        // Validate scholarship type
        if !["percentage", "fixed_amount", "waiver"].contains(&scholarship_type.as_str()) {
            return Err(
                "scholarshipType must be 'percentage', 'fixed_amount', or 'waiver'".to_string(),
            );
        }

        let discount_amount = data.discount_amount
            .ok_or("discountAmount is required when scholarship is applied")?;

        if discount_amount < 0.0 {
            return Err("discountAmount cannot be negative".to_string());
        }

        // Validate that original amount is present when scholarship is applied
        let orig_amt = data.original_amount
            .ok_or("originalAmount is required when scholarship is applied")?;

        // Discount cannot exceed original amount
        if discount_amount > orig_amt {
            return Err("discountAmount cannot exceed originalAmount".to_string());
        }

        // Validate scholarship value constraints
        if scholarship_type == "percentage" {
            let scholarship_value = data.scholarship_value
                .ok_or("scholarshipValue is required for percentage type")?;

            if scholarship_value < 0.0 || scholarship_value > 100.0 {
                return Err("scholarshipValue for percentage must be between 0 and 100".to_string());
            }
        }

        // Validate total amount calculation with discount
        let expected_total = orig_amt - discount_amount;
        let tolerance = 0.01; // Allow small floating point differences
        if (data.total_amount - expected_total).abs() > tolerance {
            return Err(format!(
                "totalAmount ({}) should equal originalAmount ({}) minus discountAmount ({})",
                data.total_amount, orig_amt, discount_amount
            ));
        }
    }

    // Validate amounts are non-negative
    if data.total_amount < 0.0 {
        return Err("totalAmount cannot be negative".to_string());
    }

    if data.amount_paid < 0.0 {
        return Err("amountPaid cannot be negative".to_string());
    }

    // Validate balance calculation
    let expected_balance = data.total_amount - data.amount_paid;
    let tolerance = 0.01;
    if (data.balance - expected_balance).abs() > tolerance {
        return Err(format!(
            "balance ({}) must equal totalAmount ({}) minus amountPaid ({})",
            data.balance, data.total_amount, data.amount_paid
        ));
    }

    // Validate status
    if !["unpaid", "partial", "paid", "overpaid"].contains(&data.status.as_str()) {
        return Err("status must be 'unpaid', 'partial', 'paid', or 'overpaid'".to_string());
    }

    // Validate status matches amounts
    if data.amount_paid == 0.0 && data.status != "unpaid" {
        return Err("status must be 'unpaid' when amountPaid is 0".to_string());
    }

    if data.balance == 0.0 && data.status != "paid" {
        return Err("status must be 'paid' when balance is 0".to_string());
    }

    if data.balance < 0.0 && data.status != "overpaid" {
        return Err("status must be 'overpaid' when balance is negative".to_string());
    }

    if data.amount_paid > 0.0 && data.balance > 0.0 && data.status != "partial" {
        return Err("status must be 'partial' when partially paid".to_string());
    }

    // Validate due date format if present
    if let Some(ref due_date) = data.due_date {
        validate_iso_date(due_date)?;
    }

    Ok(())
}

/// Validate scholarship document
pub fn validate_scholarship(context: &AssertSetDocContext) -> Result<(), String> {
    let data: ScholarshipData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid scholarship data format: {}", e))?;

    // Validate required fields
    if data.name.trim().is_empty() {
        return Err("name cannot be empty".to_string());
    }

    if !["percentage", "fixed_amount", "full_waiver"].contains(&data.scholarship_type.as_str()) {
        return Err("type must be 'percentage', 'fixed_amount', or 'full_waiver'".to_string());
    }

    // Validate discount values based on type
    if data.scholarship_type == "percentage" {
        let percentage_off = data.percentage_off
            .ok_or("percentageOff is required for percentage type")?;

        if percentage_off < 0.0 || percentage_off > 100.0 {
            return Err("percentageOff must be between 0 and 100".to_string());
        }
    }

    if data.scholarship_type == "fixed_amount" {
        let fixed_amount_off = data.fixed_amount_off
            .ok_or("fixedAmountOff is required for fixed_amount type")?;

        if fixed_amount_off <= 0.0 {
            return Err("fixedAmountOff must be greater than 0".to_string());
        }
    }

    // Validate applicableTo
    if !["all", "specific_classes", "specific_students"].contains(&data.applicable_to.as_str()) {
        return Err(
            "applicableTo must be 'all', 'specific_classes', or 'specific_students'".to_string(),
        );
    }

    // Validate class/student IDs if applicable
    if data.applicable_to == "specific_classes" {
        let class_ids = data.class_ids.as_ref()
            .ok_or("classIds is required when applicableTo is 'specific_classes'")?;

        if class_ids.is_empty() {
            return Err("classIds cannot be empty for specific_classes".to_string());
        }
    }

    if data.applicable_to == "specific_students" {
        let student_ids = data.student_ids.as_ref()
            .ok_or("studentIds is required when applicableTo is 'specific_students'")?;

        if student_ids.is_empty() {
            return Err("studentIds cannot be empty for specific_students".to_string());
        }
    }

    // Validate dates
    validate_iso_date(&data.start_date)?;

    if let Some(ref end_date) = data.end_date {
        validate_iso_date(end_date)?;

        // End date should be after start date
        if end_date <= &data.start_date {
            return Err("endDate must be after startDate".to_string());
        }
    }

    // Validate beneficiary limits
    if let Some(max_beneficiaries) = data.max_beneficiaries {
        if max_beneficiaries < 1 {
            return Err("maxBeneficiaries must be at least 1".to_string());
        }

        let current_beneficiaries = data.current_beneficiaries.unwrap_or(0);

        if current_beneficiaries > max_beneficiaries {
            return Err("currentBeneficiaries cannot exceed maxBeneficiaries".to_string());
        }
    }

    // Validate status
    if !["active", "suspended", "expired"].contains(&data.status.as_str()) {
        return Err("status must be 'active', 'suspended', or 'expired'".to_string());
    }

    // Validate createdBy
    if data.created_by.trim().is_empty() {
        return Err("createdBy cannot be empty".to_string());
    }

    Ok(())
}

/// Validate ISO date format (YYYY-MM-DD)
fn validate_iso_date(date_str: &str) -> Result<(), String> {
    if date_str.len() != 10 {
        return Err(format!("Invalid date format: {}. Expected YYYY-MM-DD", date_str));
    }
    
    let parts: Vec<&str> = date_str.split('-').collect();
    if parts.len() != 3 {
        return Err(format!("Invalid date format: {}. Expected YYYY-MM-DD", date_str));
    }

    // Validate year (4 digits)
    if parts[0].len() != 4 || !parts[0].chars().all(|c| c.is_numeric()) {
        return Err(format!("Invalid year in date: {}", date_str));
    }
    
    // Validate month (2 digits)
    if parts[1].len() != 2 || !parts[1].chars().all(|c| c.is_numeric()) {
        return Err(format!("Invalid month in date: {}", date_str));
    }
    
    // Validate day (2 digits)
    if parts[2].len() != 2 || !parts[2].chars().all(|c| c.is_numeric()) {
        return Err(format!("Invalid day in date: {}", date_str));
    }

    let year: i32 = parts[0].parse().unwrap(); // Safe because we validated
    let month: u32 = parts[1].parse().unwrap();
    let day: u32 = parts[2].parse().unwrap();

    if year < 1900 || year > 2100 {
        return Err(format!("Year out of range: {}", year));
    }

    if month < 1 || month > 12 {
        return Err(format!("Month out of range: {}", month));
    }

    if day < 1 || day > 31 {
        return Err(format!("Day out of range: {}", day));
    }

    Ok(())
}
