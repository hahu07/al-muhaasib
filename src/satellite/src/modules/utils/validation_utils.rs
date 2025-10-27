//! Utility functions for validation across different modules

use serde::Deserialize;

// Helper functions that can be used across modules
pub fn parse_date(date: &str) -> Result<(u32, u32, u32), ()> {
    let parts: Vec<&str> = date.split('-').collect();
    if parts.len() != 3 { return Err(()); }
    
    let year = parts[0].parse::<u32>().map_err(|_| ())?;
    let month = parts[1].parse::<u32>().map_err(|_| ())?;
    let day = parts[2].parse::<u32>().map_err(|_| ())?;
    
    Ok((year, month, day))
}

pub fn date_to_timestamp(year: u32, month: u32, day: u32) -> u64 {
    // Simple timestamp calculation (approximate)
    let days_since_1970 = (year - 1970) * 365 + (month - 1) * 30 + day;
    days_since_1970 as u64 * 24 * 60 * 60 * 1_000_000_000 // Convert to nanoseconds
}

// Email validation
pub fn is_valid_email(email: &str) -> bool {
    email.contains('@') && email.contains('.') && email.len() > 5
}

// Phone number validation (Nigerian format)
pub fn is_valid_phone_number(phone: &str) -> bool {
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

// URL validation
pub fn is_valid_url(url: &str) -> bool {
    url.starts_with("http://") || url.starts_with("https://")
}

// Date format validation
pub fn is_valid_date_format(date: &str) -> bool {
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

// Date validation functions
pub fn is_date_in_future(date: &str) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        date_timestamp > current_time
    } else {
        false
    }
}

pub fn is_date_too_far_in_future(date: &str) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        let seven_days = 7 * 24 * 60 * 60 * 1_000_000_000u64; // 7 days in nanoseconds
        
        date_timestamp > current_time + seven_days
    } else {
        false
    }
}

pub fn is_date_too_far_in_future_30_days(date: &str) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        let thirty_days = 30 * 24 * 60 * 60 * 1_000_000_000u64; // 30 days in nanoseconds
        
        date_timestamp > current_time + thirty_days
    } else {
        false
    }
}

pub fn is_date_too_old(date: &str, years: i32) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        let years_ns = (years as u64) * 365 * 24 * 60 * 60 * 1_000_000_000u64; // years in nanoseconds
        
        date_timestamp < current_time - years_ns
    } else {
        false
    }
}

pub fn is_date_too_old_2_years(date: &str) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        let two_years = 2 * 365 * 24 * 60 * 60 * 1_000_000_000u64; // 2 years in nanoseconds
        
        date_timestamp < current_time - two_years
    } else {
        false
    }
}

// Staff-specific utility functions
pub fn is_employment_date_too_old(date: &str) -> bool {
    if let Ok(parsed_date) = parse_date(date) {
        let current_time = ic_cdk::api::time();
        let date_timestamp = date_to_timestamp(parsed_date.0, parsed_date.1, parsed_date.2);
        let fifty_years = 50 * 365 * 24 * 60 * 60 * 1_000_000_000u64; // 50 years in nanoseconds
        
        date_timestamp < current_time - fifty_years
    } else {
        false
    }
}

pub fn is_valid_department_name(name: &str) -> bool {
    // Department names should contain only letters, numbers, spaces, and basic punctuation
    name.len() <= 50 && name.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || "._-&'()".contains(c)
    })
}

pub fn is_valid_account_number(account: &str) -> bool {
    // Nigerian bank account numbers are typically 10 digits
    account.len() == 10 && account.chars().all(|c| c.is_numeric())
}

// Reference validation functions
pub fn is_valid_reference(reference: &str) -> bool {
    reference.len() >= 7 && reference.contains('-')
}

pub fn is_valid_expense_reference(reference: &str) -> bool {
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

pub fn is_valid_payment_reference(reference: &str) -> bool {
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

pub fn is_valid_salary_reference(reference: &str) -> bool {
    // Format: SAL-YYYY-MM-XXXXXX (SAL- + 4-digit year + - + 2-digit month + - + 6 alphanumeric)
    // Total: 3 + 1 + 4 + 1 + 2 + 1 + 6 = 18 characters
    if reference.len() != 18 { return false; }
    
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

// Category and budget validation
pub fn is_valid_category_name(name: &str) -> bool {
    let len = name.len();
    len >= 3 && len <= 100 && name.chars().all(|c| {
        c.is_alphanumeric() || c.is_whitespace() || "._-'()".contains(c)
    })
}

pub fn is_valid_budget_code(code: &str) -> bool {
    if code.len() != 7 { return false; }
    let parts: Vec<&str> = code.split('-').collect();
    if parts.len() != 2 { return false; }
    
    parts[0].len() == 3 && parts[0].chars().all(|c| c.is_alphabetic()) &&
    parts[1].len() == 3 && parts[1].chars().all(|c| c.is_numeric())
}

// Amount validation
pub fn is_valid_amount(amount: f64) -> bool {
    amount >= 0.0 && amount <= 1_000_000.0
}

// Serde helper: accept either a string or a u64 and return String
pub fn de_string_or_u64_to_string<'de, D>(deserializer: D) -> Result<String, D::Error>
where
    D: serde::Deserializer<'de>,
{
    #[derive(Deserialize)]
    #[serde(untagged)]
    enum StrOrU64 {
        S(String),
        U(u64),
    }

    match StrOrU64::deserialize(deserializer)? {
        StrOrU64::S(s) => Ok(s),
        StrOrU64::U(n) => Ok(n.to_string()),
    }
}

