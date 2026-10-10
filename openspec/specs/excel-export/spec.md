# excel-export Specification

## Purpose
Generates cleanly formatted Microsoft Excel workbooks (.xlsx) containing institutional headers, examination metadata, student code numbers, question breakdown, and verified totals ready for submission.

## Requirements

### Requirement: Structured institutional workbook generation
The system SHALL export a compliant `.xlsx` workbook formatted with institutional title blocks matching university standards.

#### Scenario: User clicks Export to Excel
- **WHEN** user clicks the "Download Excel (.xlsx)" button
- **THEN** system prompts download of `EEE_2121_Detailed_Mark_Sheet.xlsx` within 500ms

#### Scenario: Workbook contains complete metadata block
- **WHEN** exported workbook is opened in Excel, Google Sheets, or LibreOffice
- **THEN** top rows display University Name, Session/Year, Semester, Examination, Department, Course Code, and Course Title before the marks table

### Requirement: Formatted grade table layout
The system SHALL format column headers (`Code No.`, `Q1` through `Q10`, `Total Mark`), align numeric columns, apply cell border styling, and set column widths proportionally.

#### Scenario: Numeric column alignment and formulas
- **WHEN** exported table data is inspected
- **THEN** student codes are centered, question marks and totals are right-aligned numeric cells, and Total Mark uses formula or exact verified numeric values
