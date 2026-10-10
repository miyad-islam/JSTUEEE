import React, { useState, useEffect } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Settings,
  Sparkles,
  Download,
  Moon,
  Sun,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Layers
} from 'lucide-react';
import DocumentViewer from './components/DocumentViewer';
import GradeTable from './components/GradeTable';
import ApiKeyModal from './components/ApiKeyModal';
import { sampleEEE2121 } from './data/sampleEEE2121';
import { convertPdfToImages } from './utils/pdfProcessor';
import { extractMarksheetWithGemini } from './utils/geminiVision';
import { normalizeMarksheetResponse } from './utils/marksheetNormalizer';

const BLANK_METADATA = {
  university: "",
  academicSession: "",
  yearSemester: "",
  examination: "",
  department: "",
  courseCode: "",
  courseTitle: "",
  examinerName: "",
  examinerDesignation: "",
  signDate: ""
};

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  
  // Mobile tab state: 'doc' or 'table'
  const [mobileTab, setMobileTab] = useState('doc');

  // Gemini API Key state - loaded securely from browser storage or Netlify environment
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Document pages state
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Academic Marksheet metadata & student rows
  const [metadata, setMetadata] = useState(sampleEEE2121.metadata);
  const [records, setRecords] = useState(sampleEEE2121.records);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Sync theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  };

  const showToast = (text, type = 'info') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
    showToast('Gemini API Key saved successfully', 'success');
  };

  // Helper to read single image file to dataUrl
  const readFileAsDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  };

  // Multi-File Upload Handler (Supports multiple PDFs, images, or mixed)
  const handleFileUpload = async (fileInput) => {
    try {
      setIsProcessing(true);
      const fileList = fileInput instanceof FileList ? Array.from(fileInput) : (Array.isArray(fileInput) ? fileInput : [fileInput]);
      
      if (fileList.length === 0) return;

      setProcessingStatus(`Loading ${fileList.length} file(s)...`);
      const newPages = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          setProcessingStatus(`Rendering PDF: ${file.name}...`);
          const rendered = await convertPdfToImages(file, 2.0);
          rendered.forEach((p) => {
            newPages.push({
              pageNumber: newPages.length + 1,
              dataUrl: p.dataUrl,
              sourceFile: file.name
            });
          });
        } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) {
          setProcessingStatus(`Loading image: ${file.name}...`);
          const dataUrl = await readFileAsDataUrl(file);
          newPages.push({
            pageNumber: newPages.length + 1,
            dataUrl,
            sourceFile: file.name
          });
        }
      }

      if (newPages.length > 0) {
        setPages(newPages);
        setCurrentPageIndex(0);
        showToast(`Loaded ${newPages.length} mark sheet page(s) ready for extraction`, 'success');
      } else {
        showToast('Please upload a valid PDF or image file (PNG/JPG/WEBP)', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading file(s): ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Complete Reset: Clears ALL names, info, marks, and uploaded documents
  const handleResetAll = () => {
    setMetadata(BLANK_METADATA);
    setRecords([]);
    setPages([]);
    setCurrentPageIndex(0);
    showToast('Reset complete: All headers, marks, and documents cleared', 'success');
  };

  // Load blank 0s template
  const handleLoadZeroTemplate = () => {
    setMetadata(sampleEEE2121.metadata);
    setRecords(sampleEEE2121.records);
    showToast('Loaded 30 student template with zero marks', 'success');
  };

  // Extract Single Active Page with AI
  const handleTriggerOcr = async () => {
    if (pages.length === 0) {
      showToast('Please upload a PDF or image first', 'error');
      return;
    }

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    const activePage = pages[currentPageIndex];
    if (!activePage) return;

    try {
      setIsProcessing(true);
      setProcessingStatus(`Analyzing Page ${currentPageIndex + 1}...`);

      const rawAiResponse = await extractMarksheetWithGemini(
        activePage.dataUrl,
        apiKey,
        currentPageIndex + 1,
        (msg) => setProcessingStatus(msg)
      );

      // Normalize any AI response variation
      const normalized = normalizeMarksheetResponse(rawAiResponse, currentPageIndex + 1);

      // Update metadata if found
      if (Object.keys(normalized.metadata).length > 0) {
        setMetadata((prev) => ({
          ...prev,
          ...normalized.metadata
        }));
      }

      // Merge records
      if (normalized.records.length > 0) {
        setRecords((prev) => {
          // If previous records were empty or page 1, overwrite; else merge by code
          if (prev.length === 0 || currentPageIndex === 0) {
            return normalized.records;
          }
          const existingCodes = new Set(prev.map((r) => r.codeNo));
          const additions = normalized.records.filter((nr) => !existingCodes.has(nr.codeNo));
          return [...prev, ...additions];
        });

        showToast(
          `Extracted ${normalized.records.length} student marks from Page ${currentPageIndex + 1}!`,
          'success'
        );
        setMobileTab('table');
      } else {
        showToast('AI processed image but could not identify student rows. Please verify clarity.', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Batch Extract All Pages sequentially
  const handleTriggerBatchOcr = async () => {
    if (pages.length === 0) {
      showToast('Please upload pages first', 'error');
      return;
    }

    if (!apiKey) {
      setIsKeyModalOpen(true);
      return;
    }

    try {
      setIsProcessing(true);
      let combinedRecords = [];
      let latestMetadata = {};

      for (let i = 0; i < pages.length; i++) {
        setProcessingStatus(`Batch processing Page ${i + 1} of ${pages.length}...`);
        setCurrentPageIndex(i);

        const raw = await extractMarksheetWithGemini(
          pages[i].dataUrl,
          apiKey,
          i + 1,
          (msg) => setProcessingStatus(`Page ${i + 1}/${pages.length}: ${msg}`)
        );

        const normalized = normalizeMarksheetResponse(raw, i + 1);

        if (Object.keys(normalized.metadata).length > 0) {
          latestMetadata = { ...latestMetadata, ...normalized.metadata };
        }

        if (normalized.records.length > 0) {
          // Deduplicate
          const existingCodes = new Set(combinedRecords.map((r) => r.codeNo));
          const newRows = normalized.records.filter((nr) => !existingCodes.has(nr.codeNo));
          combinedRecords = [...combinedRecords, ...newRows];
        }
      }

      // Apply all batch results
      if (Object.keys(latestMetadata).length > 0) {
        setMetadata((prev) => ({ ...prev, ...latestMetadata }));
      }

      if (combinedRecords.length > 0) {
        setRecords(combinedRecords);
        showToast(
          `Batch OCR Complete: Extracted ${combinedRecords.length} students across ${pages.length} pages!`,
          'success'
        );
        setMobileTab('table');
      } else {
        showToast('Batch processing finished but no student rows found', 'warning');
      }
    } catch (err) {
      console.error(err);
      showToast('Batch extraction stopped: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleUpdateMetadata = (field, val) => {
    setMetadata((prev) => ({ ...prev, [field]: val }));
  };

  const handleAddRow = () => {
    const newRow = {
      id: `row-${Date.now()}`,
      codeNo: '',
      q1: '', q2: '', q3: '', q4: '', q5: '',
      q6: '', q7: '', q8: '', q9: '', q10: '',
      totalMark: '',
      page: currentPageIndex + 1
    };
    setRecords((prev) => [...prev, newRow]);
  };

  const handleDeleteRow = (id) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // Discrepancy count for quick mobile indicator
  const discrepancyCount = records.filter((row) => {
    const qVals = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10];
    const calc = qVals.reduce((sum, v) => {
      const n = Number(v);
      return !isNaN(n) && v !== '' && v !== null ? sum + n : sum;
    }, 0);
    const stated = Number(row.totalMark);
    return !isNaN(stated) && stated !== calc;
  }).length;

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand-section">
          <div className="brand-icon">
            <FileSpreadsheet size={22} />
          </div>
          <div>
            <h1 className="brand-title">GradeDigitizer AI</h1>
          </div>
          <span className="brand-badge">Multimodal OCR</span>
        </div>

        <div className="nav-actions">
          <button
            className="btn btn-secondary"
            onClick={handleResetAll}
            title="Clear all names, data, and uploads"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem', color: '#f87171' }}
          >
            <Trash2 size={14} />
            <span className="hide-mobile">Reset All</span>
          </button>

          <button
            className="btn btn-secondary"
            onClick={handleLoadZeroTemplate}
            title="Load blank template table"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
          >
            <RotateCcw size={14} />
            <span className="hide-mobile">Template 0s</span>
          </button>

          <button
            className="btn btn-icon"
            onClick={() => setIsKeyModalOpen(true)}
            title="Configure Gemini API Key"
            aria-label="API Settings"
          >
            <Settings size={18} />
          </button>

          <button
            className="btn btn-icon"
            onClick={toggleTheme}
            title="Toggle Dark / Light Theme"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Mobile Segmented Tab Navigation */}
      <nav className="mobile-tab-bar" aria-label="Mobile View Selector">
        <button
          className={`tab-btn ${mobileTab === 'doc' ? 'active' : ''}`}
          onClick={() => setMobileTab('doc')}
        >
          <FileText size={16} />
          <span>Original Document</span>
          {pages.length > 0 && <span style={{ fontSize: '0.75rem' }}>({pages.length}p)</span>}
        </button>
        <button
          className={`tab-btn ${mobileTab === 'table' ? 'active' : ''}`}
          onClick={() => setMobileTab('table')}
        >
          <FileSpreadsheet size={16} />
          <span>Marks Table ({records.length})</span>
          {discrepancyCount > 0 ? (
            <span style={{ background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', padding: '0.1rem 0.4rem', borderRadius: '999px' }}>
              {discrepancyCount}
            </span>
          ) : (
            <span style={{ color: 'var(--success)', fontSize: '0.75rem' }}>✓</span>
          )}
        </button>
      </nav>

      {/* Toast Alert */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: toastMessage.type === 'error' ? 'var(--danger)' : '#1e293b',
            color: '#ffffff',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            border: '1px solid var(--border-subtle)'
          }}
        >
          {toastMessage.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} color="#10b981" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Dual-View Workstation */}
      <main className={`workstation mobile-tab-${mobileTab}`}>
        {/* Left: Document Viewer */}
        <DocumentViewer
          pages={pages}
          currentPageIndex={currentPageIndex}
          onPageChange={setCurrentPageIndex}
          onFileUpload={handleFileUpload}
          onTriggerOcr={handleTriggerOcr}
          onTriggerBatchOcr={handleTriggerBatchOcr}
          isProcessing={isProcessing}
          processingStatus={processingStatus}
        />

        {/* Right: Grade Table & Verification */}
        <GradeTable
          metadata={metadata}
          onUpdateMetadata={handleUpdateMetadata}
          records={records}
          onUpdateRecords={setRecords}
          onAddRow={handleAddRow}
          onDeleteRow={handleDeleteRow}
        />
      </main>

      {/* Settings Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
}
