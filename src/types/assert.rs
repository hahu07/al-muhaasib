use junobuild_satellite::{
    set_doc, list_docs, decode_doc_data, encode_doc_data,
    Document, ListParams, ListMatcher
};
use ic_cdk::api::time;
use std::collections::HashMap;

#[assert_set_doc(collections = ["users", "votes", "tags"])]
fn assert_set_doc(context: AssertSetDocContext) -> Result<(), String> {
    match context.data.collection.as_str() {
        "users" => validate_user_document(&context),
        "votes" => validate_vote_document(&context),
        "tags" => validate_tag_document(&context),
        _ => Err(format!("Unknown collection: {}", context.data.collection))
    }
}

fn validate_user_document(context: &AssertSetDocContext) -> Result<(), String> {
    // Decode and validate the user data structure
    let user_data: UserData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid user data format: {}", e))?;

    // Validate username format (3-20 chars, alphanumeric + limited symbols)
    if !is_valid_username(&user_data.username) {
        return Err("Username must be 3-20 characters and contain only letters, numbers, and underscores".to_string());
    }

    // Check username uniqueness by searching existing documents
    let search_pattern = format!("username={};", user_data.username.to_lowercase());
    let existing_users = list_docs(
        String::from("users"),
        ListParams {
            matcher: Some(ListMatcher {
                description: Some(search_pattern),
                ..Default::default()
            }),
            ..Default::default()
        },
    );

    // If this is an update operation, exclude the current document
    let is_update = context.data.data.before.is_some();
    for (doc_key, _) in existing_users.items {
        if is_update && doc_key == context.data.key {
            continue;
        }

        return Err(format!("Username '{}' is already taken", user_data.username));
    }

    Ok(())
}

fn validate_vote_document(context: &AssertSetDocContext) -> Result<(), String> {
    // Decode vote data
    let vote_data: VoteData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid vote data format: {}", e))?;

    // Validate vote value constraints
    if vote_data.value < -1.0 || vote_data.value > 1.0 {
        return Err(format!("Vote value must be -1, 0, or 1 (got: {})", vote_data.value));
    }

    // Validate vote weight constraints
    if vote_data.weight < 0.0 || vote_data.weight > 1.0 {
        return Err(format!("Vote weight must be between 0.0 and 1.0 (got: {})", vote_data.weight));
    }

    // Validate tag exists
    let tag_params = ListParams {
        matcher: Some(ListMatcher {
            key: Some(vote_data.tag_key.clone()),
            ..Default::default()
        }),
        ..Default::default()
    };

    let existing_tags = list_docs(String::from("tags"), tag_params);
    if existing_tags.items.is_empty() {
        return Err(format!("Tag not found: {}", vote_data.tag_key));
    }

    // Prevent self-voting
    if vote_data.author_key == vote_data.target_key {
        return Err("Users cannot vote on themselves".to_string());
    }

    Ok(())
}

fn validate_tag_document(context: &AssertSetDocContext) -> Result<(), String> {
    // Decode tag data
    let tag_data: TagData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid tag data format: {}", e))?;

    // Validate tag name format and uniqueness
    if !is_valid_tag_name(&tag_data.name) {
        return Err("Tag name must be 3-50 characters and contain only letters, numbers, and underscores".to_string());
    }

    // Check tag name uniqueness
    let search_pattern = format!("name={};", tag_data.name.to_lowercase());
    let existing_tags = list_docs(
        String::from("tags"),
        ListParams {
            matcher: Some(ListMatcher {
                description: Some(search_pattern),
                ..Default::default()
            }),
            ..Default::default()
        },
    );

    let is_update = context.data.data.before.is_some();
    for (doc_key, _) in existing_tags.items {
        if is_update && doc_key == context.data.key {
            continue;
        }
        return Err(format!("Tag name '{}' is already taken", tag_data.name));
    }

    // Validate description length
    if tag_data.description.len() > 1024 {
        return Err(format!(
            "Tag description cannot exceed 1024 characters (current length: {})",
            tag_data.description.len()
        ));
    }

    // Validate time periods
    validate_time_periods(&tag_data.time_periods)?;

    // Validate vote reward
    if tag_data.vote_reward < 0.0 || tag_data.vote_reward > 1.0 {
        return Err(format!(
            "Vote reward must be between 0.0 and 1.0 (got: {})",
            tag_data.vote_reward
        ));
    }

    Ok(())
}

fn validate_time_periods(periods: &[TimePeriod]) -> Result<(), String> {
    if periods.is_empty() {
        return Err("Tag must have at least 1 time period".to_string());
    }
    if periods.len() > 10 {
        return Err(format!(
            "Tag cannot have more than 10 time periods (got: {})",
            periods.len()
        ));
    }

    // Last period must be "infinity" (999 months)
    let last_period = periods.last().unwrap();
    if last_period.months != 999 {
        return Err(format!(
            "Last period must be 999 months (got: {})",
            last_period.months
        ));
    }

    // Validate each period's configuration
    for (i, period) in periods.iter().enumerate() {
        // Validate multiplier range (0.05 to 10.0)
        if period.multiplier < 0.05 || period.multiplier > 10.0 {
            return Err(format!(
                "Multiplier for period {} must be between 0.05 and 10.0 (got: {})",
                i + 1, period.multiplier
            ));
        }

        // Validate multiplier step increments (0.05)
        let multiplier_int = (period.multiplier * 100.0).round();
        let remainder = multiplier_int % 5.0;
        if remainder > 0.000001 {
            return Err(format!(
                "Multiplier for period {} must use 0.05 step increments (got: {})",
                i + 1, period.multiplier
            ));
        }

        // Validate month duration
        if period.months == 0 {
            return Err(format!(
                "Months for period {} must be greater than 0 (got: {})",
                i + 1, period.months
            ));
        }
    }

    Ok(())
}