# Tasks

## 1. Project Scaffolding & Setup

- [x] 1.1 Initialize Vite React application with modern styling foundation and verify `npm run dev` builds successfully
- [x] 1.2 Install production dependencies (`lucide-react`, `xlsx`, `pdfjs-dist`) and verify imports resolve cleanly
- [x] 1.3 Configure `netlify.toml` with build commands, output directory (`dist`), and SPA redirect rules

## 2. Document Ingestion & Interactive Viewer

- [x] 2.1 Implement multi-format upload zone supporting drag-and-drop and camera selection for PDFs, PNGs, and JPEGs
- [x] 2.2 Build canvas-based multi-page PDF renderer using `pdfjs-dist` and verify page thumbnails and switching
- [x] 2.3 Implement zoom (50%-300%), rotate, and pan controls with touch gesture support on mobile devices

## 3. Vision OCR Extraction Engine

- [x] 3.1 Implement Gemini 2.0 Flash Vision client with structured JSON schema for academic exam mark sheets
- [x] 3.2 Build API key manager modal with secure browser `localStorage` encryption and status indicator
- [x] 3.3 Add multi-page batch OCR processing pipeline with progress bar and retry on transient network failures
- [x] 3.4 Build sample demo loader with pre-extracted data from `EEE 2121 SEF.pdf` so teachers can test without an immediate API key

## 4. Responsive Grade Table & Verification Engine

- [x] 4.1 Build dual-responsive layout (desktop 50/50 split-screen, mobile tabbed view with quick-switch floating toggle)
- [x] 4.2 Implement academic metadata header editor (University, Department, Course Code, Session, Examiner)
- [x] 4.3 Create editable spreadsheet table for Student Code Numbers, Q1 through Q10 marks, and stated totals
- [x] 4.4 Implement real-time checksum validator highlighting rows where `sum(Q1..Q10) !== statedTotal` with alert pills

## 5. Excel Export Engine

- [x] 5.1 Implement SheetJS (`xlsx`) export utility formatting university headers, column headers, and tabular data
- [x] 5.2 Add customized styling for Excel (auto column widths, numeric cell formatting, filename: `EEE_2121_Detailed_Mark_Sheet.xlsx`)
- [x] 5.3 Verify generated `.xlsx` opens correctly with all student codes (321030–321059) and question marks intact

## 6. Testing, Evaluation & Netlify Deployment Readiness

- [x] 6.1 Run end-to-end extraction test with `EEE 2121 SEF.pdf` and verify all 30 student marks match original document
- [x] 6.2 Test mobile responsiveness on 375px (iPhone) and 768px (iPad) viewports and verify touch pan and table editing
- [x] 6.3 Execute `npm run build` and verify zero lint errors, production bundle optimization, and Netlify deploy readiness
