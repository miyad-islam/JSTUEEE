# marksheet-ocr-extraction Specification

## Purpose
Extracts university examination metadata and handwritten student grade marks from uploaded document pages using Gemini Flash Vision AI with structured JSON schema output.

## Requirements

### Requirement: Academic marksheet header extraction
The system SHALL parse document header fields including University Name, Academic Session/Year, Semester, Examination Name, Department, Course Code, Course Title, and Examiner Details.

#### Scenario: Marksheet header parsed from scanned page
- **WHEN** page 1 of an exam document is submitted for AI extraction
- **THEN** system populates Department ("EEE"), Course Code ("EEE 2121"), Course Title ("Electronic Device and Circuit II"), and session fields into editable form controls

### Requirement: Handwritten tabular marks extraction
The system SHALL extract rows containing Student Code Number, Question Marks for Q1 through Q10, and stated Total Mark from the scanned table grid.

#### Scenario: Full page student rows digitized
- **WHEN** AI vision analysis completes for document page 1
- **THEN** system extracts 17 student rows (codes 321030 through 321046) with corresponding individual question marks and stated totals into tabular records

#### Scenario: Multi-page document aggregation
- **WHEN** document contains multiple pages (such as page 1 and page 2 of EEE 2121 SEF.pdf)
- **THEN** system processes all pages sequentially or in parallel and merges student records in ascending code order without duplicates

### Requirement: Resilient API key handling
The system SHALL allow user to input their Gemini API key with client-side encrypted local storage persistence, and support pre-configured Netlify serverless environment variables.

#### Scenario: Missing API key prompt
- **WHEN** user attempts extraction without a configured Gemini API key
- **THEN** system prompts an accessible modal to enter their Gemini API key with a direct link to Google AI Studio
