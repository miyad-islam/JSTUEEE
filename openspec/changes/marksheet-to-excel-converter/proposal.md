# Proposal: University Mark Sheet to Excel Web Application

## Why

University faculty currently spend hours manually transcribing handwritten exam mark sheets (such as the confidential Detailed Mark Sheet for Course `EEE 2121: Electronic Device and Circuit II` from Jamalpur Science & Technology University) into computer spreadsheets. Manual transcription is slow, tedious, and prone to costly grading errors. By creating a modern, dual-responsive (desktop and mobile) web application deployable on Netlify, teachers can upload scanned PDFs or photos of mark sheets, automatically extract student marks via vision AI, verify and correct any discrepancies in an interactive side-by-side grid with automatic sum validation, and export clean, formatted Excel files (.xlsx) in seconds.

## What Changes

- **Dual-responsive web application**: Modern, mobile-first and desktop-optimized UI tailored for university instructors.
- **Multimodal file ingestion**: Drag-and-drop or camera upload supporting multi-page scanned PDFs and high-res images (PNG, JPG, WEBP).
- **Vision-powered OCR extraction**: Integration with Gemini Flash Vision API (via secure Netlify Function or direct client key storage) to parse handwritten university marks, student code numbers, question breakdown (Q1–Q10), and totals.
- **Side-by-side verification grid**: Desktop split-pane and mobile swipe/tab viewer to compare original document crops directly against digitized data.
- **Automatic sum validation**: Client-side checksum comparing extracted Total Mark against `sum(Q1..Q10)` with visual discrepancy warnings.
- **Professional Excel export**: One-click generation of `.xlsx` files using SheetJS containing institutional headers, exam session, course code, student code numbers, question-by-question marks, and verified totals.
- **Netlify deployment bundle**: Static build with optional Netlify Functions, zero backend server overhead, fast CDN delivery, and full offline verification support once loaded.

## Capabilities

### New Capabilities
- `document-upload-viewer`: Multi-page PDF and image intake with interactive responsive pan/zoom canvas preview.
- `marksheet-ocr-extraction`: AI vision extraction schema tuned for handwritten academic marksheet tables (Course headers, Student Code No, Q1–Q10, Total Mark).
- `interactive-grade-table`: Dual-responsive spreadsheet grid with inline editing, row addition/deletion, and automated sum discrepancy detection.
- `excel-export`: Formatted `.xlsx` generation including university metadata, tabular borders, bold headers, and formula-ready grade columns.

### Modified Capabilities
<!-- None: Greenfield project -->

## Impact
- **Architecture**: Client-side SPA built with React/Vite + Vanilla CSS tokens + Lucide icons + SheetJS (`xlsx`) + PDF.js.
- **Deployment**: Configured with `netlify.toml` for seamless static hosting and serverless function routing.
- **Security & Privacy**: Document data and student grades are processed ephemerally; API keys are saved exclusively in local storage or environment variables without persistent remote storage.
