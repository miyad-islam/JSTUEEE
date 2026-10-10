# Design: Marksheet to Excel Converter Web Application

## Context

Exam mark sheets (such as `EEE 2121 SEF.pdf`) are physical forms filled in by university examiners by hand, scanned using mobile scanners (CamScanner), and distributed as multi-page image-only PDFs. See `proposal.md` for motivation. The system must process both multi-page PDFs and individual camera captures, run reliable AI vision OCR on handwritten numbers, give teachers a rapid side-by-side verification interface, and export standard `.xlsx` spreadsheets for university tabulation.

## Goals / Non-Goals

**Goals:**
- Provide a dual-responsive (desktop dual-pane, mobile touch-first) web application deployable statically or with serverless functions on Netlify.
- Multi-page PDF page extraction using browser-native `pdfjs-dist` rendering to HTML5 Canvas.
- AI Vision extraction using Google Gemini 2.0 / 1.5 Flash Vision with structured JSON output schema matching the university exam mark sheet format.
- Real-time arithmetic verification comparing `sum(q1..q10)` with the examiner's handwritten stated total, flagging any mismatch in amber/red.
- One-click `.xlsx` generation using `xlsx` (SheetJS) with university headers and clean styling.
- Zero server database setup required; works with client-stored API key or Netlify environment variables.

**Non-Goals:**
- Heavy backend relational databases or user authentication systems (this is an on-demand utility app for faculty).
- Replacing official university grading management ERPs; the output is the standard Excel spreadsheet required by academic departments.

## Decisions

### 1. Frontend Framework: React 19 + Vite + Vanilla Modern CSS Design System
- **Choice**: React 19 + Vite with CSS variables, modern dark/light aesthetic, glassmorphism, responsive grid, and Lucide React icons.
- **Rationale**: Vite delivers near-instant build times and a tiny static footprint ideal for Netlify CDN hosting. Vanilla CSS ensures precise responsive control across all screen sizes without Tailwind bundle overhead or class clutter.
- **Alternatives considered**: Next.js (unnecessary Node server complexity for a client-side document tool), Pure Vanilla JS (harder state synchronization across split-screen zoom canvas and editable 30+ row data tables).

### 2. OCR & Vision Engine: Gemini Flash Vision with Structured Schema
- **Choice**: Google Gemini 2.0 Flash (`gemini-2.0-flash`) via REST API, calling with structured JSON response MIME type (`application/json`).
- **Rationale**: Handwritten numbers in table grids (especially marks like 12, 14, 0, 7) cause standard OCR engines (Tesseract.js) to fail with >40% error rates. Gemini 2.0 Flash has state-of-the-art handwritten digit comprehension, processes image bytes directly, responds in <3 seconds, and has a generous free tier.
- **Key Management**: Teacher can input their Gemini API key directly into a secure settings drawer (saved locally in `localStorage`), or use a Netlify serverless function (`/.netlify/functions/extract`) configured with `GEMINI_API_KEY` in Netlify dashboard.

### 3. PDF Rendering: Client-side `pdfjs-dist`
- **Choice**: Use Mozilla's `pdfjs-dist` in the browser to render PDF pages directly into `<canvas>` elements and convert to JPEG/PNG data URLs for vision ingestion.
- **Rationale**: Keeps document processing fast and private without uploading raw multi-megabyte PDF files to third-party file storage.

### 4. Verification UX: Desktop Split-Pane & Mobile Tabbed Card/Table Mode
- **Choice**:
  - **Desktop (>= 1024px)**: Left pane houses sticky document preview with zoom (50%-300%) and pan controls; right pane houses academic header cards and sticky spreadsheet table.
  - **Mobile (< 1024px)**: Segmented control switches seamlessly between "Original Scan" and "Marksheet Table", plus a floating badge showing total discrepancies count.
- **Validation Engine**: Each row automatically calculates `sum(q1..q10)`. If `sum !== statedTotal`, the row displays an alert pill `⚠ 49 ≠ 48` allowing instant correction against the original scan.

### 5. Excel Generation: SheetJS (`xlsx`)
- **Choice**: Client-side SheetJS to generate `.xlsx` binary buffers and trigger standard browser downloads.
- **Rationale**: Runs 100% in-browser, generates native Excel files compatible with Microsoft Excel 2016+, Office 365, Google Sheets, and LibreOffice Calc. Includes header metadata block and styled column widths.

## Risks / Trade-offs

- **[Risk] Scanned PDF resolution too low or rotated** → *Mitigation*: Provide manual rotate buttons (90° clockwise/counter-clockwise) and contrast boost slider in document viewer before triggering OCR.
- **[Risk] Gemini API quota / rate limits** → *Mitigation*: Process multi-page documents with smart page-by-page queuing and caching. Provide fallback manual quick-entry mode with auto-sum arithmetic for offline use.
- **[Risk] Handwritten digit ambiguity (e.g. 1 vs 7, 0 vs 6)** → *Mitigation*: The automatic checksum validator immediately flags arithmetic mismatches between individual question sums and stated total marks, pinpointing exact cells for the teacher to check.

## Migration Plan

1. Scaffold Vite + React application in root.
2. Configure Netlify build settings (`netlify.toml`) with build command `npm run build` and publish directory `dist`.
3. Add Netlify Serverless Function proxy template for optional server-side key deployment.
4. Verify local production build (`npm run build`) and preview.
