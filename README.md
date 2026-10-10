# GradeDigitizer AI — University Mark Sheet to Excel Digitizer

A modern, dual-responsive web application designed for university faculty to upload handwritten exam detailed mark sheets (PDFs scanned with CamScanner or mobile photos like `EEE 2121 SEF.pdf`), automatically digitize student marks using Gemini 3.8 Flash Vision AI, verify calculations with automated checksum indicators, and export formatted Microsoft Excel (`.xlsx`) workbooks.

Deployed ready for **Netlify**.

---

## 🌟 Key Features

1. **Dual-Responsive Layout**:
   - **Desktop (≥ 1024px)**: 50/50 split workstation with sticky pan/zoom document viewer on the left and interactive marksheet table on the right.
   - **Mobile (< 1024px)**: Segmented tab switcher (`Original Document` vs `Marks Table`) with discrepancy count badge and mobile-friendly numeric inputs.
2. **Scanned PDF & Image Processing**:
   - In-browser canvas rendering for multi-page CamScanner PDFs (`pdfjs-dist`).
   - Image contrast enhancement toggle to boost faint handwriting.
   - Zoom (50%–300%), 90° rotation, and smooth mouse/touch pan gestures.
3. **High-Precision Multimodal Vision AI**:
   - Integrated with Google Gemini 3.8 Flash REST API with strict JSON Schema output.
   - Accurately transcribes handwritten student codes (`321030`–`321059`), individual question scores (`Q1`–`Q10`), and examiner stated totals.
4. **Real-Time Arithmetic Verification & Discrepancy Highlighting**:
   - Automatically compares `sum(Q1..Q10)` against the examiner's stated total mark.
   - Displays green verified pills (`✓ Sum: 54`) for matching rows.
   - Highlights arithmetic discrepancies in red/amber with a 1-click sync button.
5. **Instant Demo Mode**:
   - Pre-loaded with the complete ground truth data for course **EEE 2121: Electronic Device and Circuit II** (30 students, Bangamata Sheikh Fojilatunnesa Mujib Science & Technology University) for instant demonstration without requiring an API key.
6. **Compliant Excel (`.xlsx`) Export**:
   - Generates formatted Excel workbooks containing institutional headers, exam session, course details, examiner signature block, aligned columns, and class statistics.

---

## 🚀 Quick Start (Local Development)

```bash
# 1. Install dependencies
bun install   # or npm install

# 2. Start development server
bun run dev   # or npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🚢 Deploying to Netlify

### Option 1: Netlify Git Integration
1. Push this repository to GitHub or GitLab.
2. Link the repository in your [Netlify Dashboard](https://app.netlify.com/).
3. Netlify will automatically detect `netlify.toml`:
   - **Build command**: `npm run build` or `bun run build`
   - **Publish directory**: `dist`
4. (Optional) Set `VITE_GEMINI_API_KEY` in Netlify Environment Variables.

### Option 2: Netlify Manual Deploy / CLI
```bash
# Build production bundle
bun run build

# Deploy via Netlify CLI
npx netlify deploy --prod --dir=dist
```

---

## 🧪 Testing

Run the automated data integrity and arithmetic checksum test suite:
```bash
bun test/verify_marksheet.test.js
```
