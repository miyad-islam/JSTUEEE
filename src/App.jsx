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
  AlertCircle
} from 'lucide-react';
import DocumentViewer from './components/DocumentViewer';
import GradeTable from './components/GradeTable';
import ApiKeyModal from './components/ApiKeyModal';
import { sampleEEE2121 } from './data/sampleEEE2121';
import { convertPdfToImages } from './utils/pdfProcessor';
import { extractMarksheetWithGemini } from './utils/geminiVision';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState(() => localStorage.getItem('app_theme') || 'dark');
  
  // Mobile tab state: 'doc' or 'table'
  const [mobileTab, setMobileTab] = useState('doc');

  // Gemini API Key state
  const [apiKey, setApiKey] = useState(() => {
    return localStorage.getItem('gemini_api_key') || import.meta.env.VITE_GEMINI_API_KEY || '';
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Document state
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Academic Marksheet state (Initialized with EEE 2121 ground truth by default for instant delight!)
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
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveApiKey = (newKey) => {
    setApiKey(newKey);
    localStorage.setItem('gemini_api_key', newKey);
    showToast('Gemini API Key updated successfully', 'success');
  };

  // File Upload Handler (PDF or Image)
  const handleFileUpload = async (file) => {
    try {
      setIsProcessing(true);
      setProcessingStatus(`Loading file: ${file.name}...`);

      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        setProcessingStatus('Rendering PDF pages via Canvas...');
        const renderedPages = await convertPdfToImages(file, 2.0);
        setPages(renderedPages);
        setCurrentPageIndex(0);
        showToast(`Loaded ${renderedPages.length} PDF page(s)`, 'success');
      } else if (file.type.startsWith('image/')) {
        // Read single image
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
          setPages([{ pageNumber: 1, dataUrl }]);
          setCurrentPageIndex(0);
          showToast('Image loaded successfully', 'success');
        };
        reader.readAsDataURL(file);
      } else {
        showToast('Please upload a PDF or image file (JPG/PNG/WEBP)', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading file: ' + err.message, 'error');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  // Load EEE 2121 Sample Demo
  const handleLoadSampleDemo = () => {
    setMetadata(sampleEEE2121.metadata);
    setRecords(sampleEEE2121.records);
    showToast('Loaded EEE 2121 Sample Exam Data (30 Students)', 'success');
  };

  // Trigger Gemini Vision AI OCR on current page
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
      setProcessingStatus(`Gemini 3.8 Flash analyzing Page ${currentPageIndex + 1}...`);

      const extracted = await extractMarksheetWithGemini(
        activePage.dataUrl,
        apiKey,
        currentPageIndex + 1,
        "gemini-3.8-flash"
      );

      // Merge metadata if present
      if (extracted.courseCode || extracted.university) {
        setMetadata((prev) => ({
          ...prev,
          university: extracted.university || prev.university,
          academicSession: extracted.academicSession || prev.academicSession,
          yearSemester: extracted.yearSemester || prev.yearSemester,
          examination: extracted.examination || prev.examination,
          department: extracted.department || prev.department,
          courseCode: extracted.courseCode || prev.courseCode,
          courseTitle: extracted.courseTitle || prev.courseTitle,
          examinerName: extracted.examinerName || prev.examinerName,
          examinerDesignation: extracted.examinerDesignation || prev.examinerDesignation
        }));
      }

      // Merge records
      if (Array.isArray(extracted.records) && extracted.records.length > 0) {
        const formattedRecords = extracted.records.map((r, i) => ({
          id: `row-page${currentPageIndex + 1}-${i}-${Date.now()}`,
          codeNo: r.codeNo || '',
          q1: r.q1 || '',
          q2: r.q2 || '',
          q3: r.q3 || '',
          q4: r.q4 || '',
          q5: r.q5 || '',
          q6: r.q6 || '',
          q7: r.q7 || '',
          q8: r.q8 || '',
          q9: r.q9 || '',
          q10: r.q10 || '',
          totalMark: r.totalMark || '',
          page: currentPageIndex + 1
        }));

        setRecords((prev) => {
          // If first page extraction or empty, replace; else append non-duplicates
          if (currentPageIndex === 0) return formattedRecords;
          const existingCodes = new Set(prev.map((p) => p.codeNo));
          const newRows = formattedRecords.filter((nr) => !existingCodes.has(nr.codeNo));
          return [...prev, ...newRows];
        });

        showToast(
          `Extracted ${formattedRecords.length} student marks from Page ${currentPageIndex + 1}`,
          'success'
        );
        // On mobile, auto-switch to table view to see results
        setMobileTab('table');
      }
    } catch (err) {
      console.error(err);
      showToast(err.message, 'error');
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
          <span className="brand-badge">EEE 2121 Ready</span>
        </div>

        <div className="nav-actions">
          <button
            className="btn btn-secondary"
            onClick={handleLoadSampleDemo}
            title="Reload EEE 2121 ground truth sample data"
            style={{ fontSize: '0.82rem', padding: '0.45rem 0.75rem' }}
          >
            <BookOpen size={14} />
            <span className="hide-mobile">EEE 2121 Demo</span>
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
          <span>Marks Table</span>
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
