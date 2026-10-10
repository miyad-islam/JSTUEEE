import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  FileText,
  Sliders,
  Layers,
  Sparkles,
  RefreshCw
} from 'lucide-react';

export default function DocumentViewer({
  pages,
  currentPageIndex,
  onPageChange,
  onFileUpload,
  onTriggerOcr,
  onTriggerBatchOcr,
  isProcessing,
  processingStatus
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [contrastBoost, setContrastBoost] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const currentPage = pages[currentPageIndex] || null;

  // Reset view on page change
  useEffect(() => {
    setPan({ x: 0, y: 0 });
  }, [currentPageIndex]);

  const handleZoomIn = () => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setRotation(0);
  };
  const handleRotate = () => setRotation((r) => (r + 90) % 360);

  // Mouse drag pan
  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Touch pan for mobile
  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = { x: touch.clientX - pan.x, y: touch.clientY - pan.y };
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setPan({
      x: touch.clientX - dragStartRef.current.x,
      y: touch.clientY - dragStartRef.current.y
    });
  };

  const handleTouchEnd = () => setIsDragging(false);

  // File drop handler
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="pane pane-viewer">
      <div className="pane-header">
        <div className="pane-title-group">
          <FileText size={18} color="#818cf8" />
          <h2 className="pane-title">Scanned Mark Sheet</h2>
          {pages.length > 0 && (
            <span className="brand-badge" style={{ textTransform: 'none' }}>
              Page {currentPageIndex + 1} of {pages.length}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <label className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}>
            <Upload size={14} />
            <span>Upload File(s)</span>
            <input
              type="file"
              multiple
              accept=".pdf,image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => e.target.files && onFileUpload(e.target.files)}
            />
          </label>
        </div>
      </div>

      {pages.length === 0 ? (
        <div
          className="dropzone"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.pdf,image/png,image/jpeg,image/webp';
            input.onchange = (e) => e.target.files && onFileUpload(e.target.files);
            input.click();
          }}
        >
          <div className="dropzone-icon">
            <Upload size={28} />
          </div>
          <div className="dropzone-text">
            <h3>Drop Mark Sheet PDF or Multiple Images</h3>
            <p>Select multi-page PDFs or one/more photos from camera or gallery</p>
          </div>
          <button type="button" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
            Browse Device Files (PDF / Images)
          </button>
        </div>
      ) : (
        <div className="viewer-workspace">
          {/* Controls Bar */}
          <div className="viewer-toolbar">
            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center' }}>
              <button
                className="btn btn-icon"
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom In"
              >
                <ZoomIn size={16} />
              </button>
              <button
                className="btn btn-icon"
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom Out"
              >
                <ZoomOut size={16} />
              </button>
              <button
                className="btn btn-icon"
                onClick={handleRotate}
                title="Rotate 90°"
                aria-label="Rotate"
              >
                <RotateCw size={16} />
              </button>
              <button
                className="btn btn-icon"
                onClick={handleResetZoom}
                title="Reset View"
                aria-label="Reset View"
              >
                <Maximize2 size={16} />
              </button>
              <button
                className={`btn btn-icon ${contrastBoost ? 'active' : ''}`}
                onClick={() => setContrastBoost(!contrastBoost)}
                title="Handwriting Contrast Boost"
                aria-label="Contrast Boost"
                style={{
                  background: contrastBoost ? 'rgba(99, 102, 241, 0.3)' : undefined,
                  borderColor: contrastBoost ? 'var(--accent-primary)' : undefined
                }}
              >
                <Sliders size={16} />
              </button>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginLeft: '0.25rem' }}>
                {Math.round(zoom * 100)}%
              </span>
            </div>

            {/* OCR Extract trigger buttons */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {pages.length > 1 && (
                <button
                  className="btn btn-primary"
                  onClick={onTriggerBatchOcr}
                  disabled={isProcessing}
                  title="Extract all pages and combine students into one sheet"
                  style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' }}
                >
                  <Layers size={14} />
                  <span>Batch Extract All ({pages.length}p)</span>
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={onTriggerOcr}
                disabled={isProcessing}
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
              >
                <Sparkles size={14} />
                <span>{pages.length > 1 ? `Extract Page ${currentPageIndex + 1}` : 'Extract with AI'}</span>
              </button>
            </div>
          </div>

          {/* Processing Banner */}
          {isProcessing && (
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                borderBottom: '1px solid var(--border-accent)',
                padding: '0.6rem 1rem',
                fontSize: '0.85rem',
                color: '#a5b4fc',
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <RefreshCw size={15} className="spin-icon" />
              <span>{processingStatus || 'Gemini Vision analyzing handwritten marks...'}</span>
            </div>
          )}

          {/* Canvas Image Container */}
          <div
            className="viewer-canvas-container"
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {currentPage && (
              <img
                src={currentPage.dataUrl}
                alt={`Scanned Marksheet Page ${currentPageIndex + 1}`}
                className="document-image"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                  filter: contrastBoost
                    ? 'contrast(150%) brightness(95%) grayscale(20%)'
                    : 'none'
                }}
                draggable={false}
              />
            )}
          </div>

          {/* Multi-page Switcher Chips */}
          {pages.length > 1 && (
            <div className="page-switcher">
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
                Pages:
              </span>
              {pages.map((p, idx) => (
                <button
                  key={idx}
                  className={`page-chip ${idx === currentPageIndex ? 'active' : ''}`}
                  onClick={() => onPageChange(idx)}
                >
                  Page {idx + 1}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
