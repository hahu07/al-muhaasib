use junobuild_satellite::{AssertSetDocContext, list_docs};
use junobuild_shared::types::list::{ListParams, ListMatcher};
use junobuild_utils::decode_doc_data;
use serde::{Deserialize, Serialize};

#[derive(Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StudentData {
    #[serde(default)]
    pub admission_number: Option<String>,
    #[serde(default)]
    pub class_id: Option<String>,
    // Allow other fields to be present but ignored
    #[serde(flatten)]
    pub _extra: std::collections::HashMap<String, serde_cbor::Value>,
}

// Backend validation trimmed to core datastore rules only
pub fn validate_student_document(context: &AssertSetDocContext) -> Result<(), String> {
    let student_data: StudentData = decode_doc_data(&context.data.data.proposed.data)
        .map_err(|e| format!("Invalid student data format: {}", e))?;

    // Uniqueness: admissionNumber must be unique if present
    if let Some(ref adm) = student_data.admission_number {
        if !adm.trim().is_empty() {
            let search_pattern = format!("admissionNumber={};", adm.to_lowercase());
            let existing = list_docs(
                String::from("students"),
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
                return Err(format!("Admission number '{}' already exists", adm));
            }
        }
    }

    // Referential integrity: classId must reference an existing class if provided
    if let Some(ref class_id) = student_data.class_id {
        if !class_id.trim().is_empty() {
            let classes = list_docs(
                String::from("classes"),
                ListParams {
                    matcher: Some(ListMatcher {
                        key: Some(class_id.to_string()),
                        ..Default::default()
                    }),
                    ..Default::default()
                },
            );
            if classes.items.is_empty() {
                return Err(format!("Class '{}' not found", class_id));
            }
        }
    }

    Ok(())
}
