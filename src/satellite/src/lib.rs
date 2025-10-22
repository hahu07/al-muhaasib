//! Main entry point for the Satellite canister

use junobuild_macros::{
    assert_delete_asset, assert_delete_doc, assert_set_doc, assert_upload_asset,
};
use junobuild_satellite::{
    include_satellite, AssertDeleteAssetContext, AssertDeleteDocContext, AssertSetDocContext,
    AssertUploadAssetContext,
};

// Import modules
pub mod modules {
    pub mod expenses;
    pub mod payments;
    pub mod staff;
    pub mod students;
    pub mod utils;
}

use modules::{
    expenses::{validate_expense_document, validate_expense_category_document},
    payments::validate_payment_document,
    staff::{validate_staff_document, validate_salary_payment_document},
    students::validate_student_document,
};

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
        "expenses" => validate_expense_document(&context),
        "expense_categories" => validate_expense_category_document(&context),
        "students" => validate_student_document(&context),
        "payments" => validate_payment_document(&context),
        "staff" => validate_staff_document(&context),
        "salary_payments" => validate_salary_payment_document(&context),
        "budgets" => Ok(()), // TODO: Implement budget validation
        "fee_categories" => Ok(()), // TODO: Implement fee category validation
        "fee_assignments" => Ok(()), // TODO: Implement fee assignment validation
        "classes" => Ok(()), // TODO: Implement class validation
        _ => Ok(()), // Allow unknown collections for now
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
