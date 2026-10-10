# Spec Delta: interactive-grade-table

## Purpose

Provides a responsive editable spreadsheet interface for teachers to inspect, verify, and correct student marks alongside an automated calculation engine that highlights discrepancies.

## ADDED Requirements

### Requirement: Inline tabular editing and row management
The system SHALL provide an editable data grid allowing modification of Student Code Numbers, Marks for Q1 through Q10, Total Mark, and addition or deletion of rows.

#### Scenario: Teacher edits an ambiguous handwritten number
- **WHEN** teacher clicks or taps a table cell for Question 3 of student code 321030
- **THEN** system enters active numeric editing mode and updates the row state on blur or enter key

#### Scenario: Teacher adds a missing student record
- **WHEN** teacher clicks the "Add Student Row" action button
- **THEN** system appends a new blank row at the bottom with editable inputs focused

### Requirement: Automated sum discrepancy verification
The system SHALL compute the real-time sum of individual question marks (`calculatedSum = sum(Q1..Q10)`) and compare it against the extracted `statedTotal`.

#### Scenario: Matching marks verification
- **WHEN** `calculatedSum` equals the stated total mark (e.g., student 321030: 12+12+4+6+0 = 34 == 34)
- **THEN** row displays a green verified badge indicating arithmetic consistency

#### Scenario: Arithmetic discrepancy warning
- **WHEN** `calculatedSum` does not equal stated total mark due to handwriting ambiguity or manual examiner miscalculation
- **THEN** row displays an amber or red warning indicator showing `Discrepancy: Q-sum (X) ≠ Total (Y)` and highlights the total cell

### Requirement: Responsive desktop side-by-side and mobile tabbed views
The system SHALL display document preview and editable table side-by-side on desktop viewports (>= 1024px), and provide responsive tabbed/drawer navigation on mobile viewports (< 1024px).

#### Scenario: Desktop side-by-side verification
- **WHEN** viewport width is 1280px or higher
- **THEN** screen divides into a 50/50 or 45/55 split with sticky synchronized preview and editable table

#### Scenario: Mobile viewport navigation
- **WHEN** viewport width is under 768px (smartphones)
- **THEN** system renders a segmented toggle ("Original Document" vs "Mark Sheet Table") with floating quick-switch button
