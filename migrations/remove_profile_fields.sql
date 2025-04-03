-- Remove fields from profiles table
ALTER TABLE profiles
DROP COLUMN nomination,
DROP COLUMN new_start_behavior,
DROP COLUMN discomfort_trigger,
DROP COLUMN group_dynamics,
DROP COLUMN core_values,
DROP COLUMN motivation_type,
DROP COLUMN stress_response,
DROP COLUMN focus_area,
DROP COLUMN self_description,
DROP COLUMN decision_style,
DROP COLUMN failure_response,
DROP COLUMN final_notes; 