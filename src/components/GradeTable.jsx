import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Calculator,
  RefreshCw
} from 'lucide-react';
import { exportMarksheetToExcel } from '../utils/excelExporter';

export default function GradeTable({
  metadata,
  onUpdateMetadata,
  records,
  onUpdateRecords,
  onAddRow,
  onDeleteRow
}) {
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Compute real-time statistics
  const stats = records.reduce(
    (acc, row) => {
      const qVals = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10];
      const calcSum = qVals.reduce((sum, v) => {
        const n = Number(v);
        return !isNaN(n) && v !== '' && v !== null ? sum + n : sum;
      }, 0);

      const stated = Number(row.totalMark);
      const isMatch = !isNaN(stated) && stated === calcSum;

      if (isMatch) {
        acc.verified += 1;
      } else {
        acc.mismatches += 1;
      }

      if (!isNaN(stated)) {
        acc.totalScoreSum += stated;
        acc.scoreCount += 1;
      }

      return acc;
    },
    { verified: 0, mismatches: 0, totalScoreSum: 0, scoreCount: 0 }
  );

  const averageScore = stats.scoreCount > 0 ? (stats.totalScoreSum / stats.scoreCount).toFixed(1) : 0;

  // Handle cell edit
  const handleCellChange = (id, field, value) => {
    onUpdateRecords((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  };

  // Sync stated total with calculated sum for a row
  const handleFixTotal = (id, calculatedSum) => {
    handleCellChange(id, 'totalMark', calculatedSum);
  };

  // Trigger Excel Export
  const handleExport = () => {
    const filename = exportMarksheetToExcel(metadata, records);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 4000);
  };

  return (
    <div className="pane pane-editor">
      {/* Pane Header */}
      <div className="pane-header">
        <div className="pane-title-group">
          <FileSpreadsheet size={18} color="#10b981" />
          <h2 className="pane-title">Verified Mark Sheet Table</h2>
          <span className="brand-badge" style={{ color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.1)' }}>
            {records.length} Students
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="btn btn-secondary"
            onClick={onAddRow}
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
          >
            <Plus size={14} />
            <span>Add Row</span>
          </button>
          <button
            className="btn btn-success"
            onClick={handleExport}
            disabled={records.length === 0}
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            <Download size={14} />
            <span>{downloadSuccess ? 'Downloaded!' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Metadata Editor Grid */}
      <div className="metadata-grid">
        <div className="meta-field">
          <label className="meta-label">Course Code</label>
          <input
            className="meta-input"
            value={metadata.courseCode || ''}
            onChange={(e) => onUpdateMetadata('courseCode', e.target.value)}
            placeholder="e.g. EEE 2121"
          />
        </div>
        <div className="meta-field">
          <label className="meta-label">Course Title</label>
          <input
            className="meta-input"
            value={metadata.courseTitle || ''}
            onChange={(e) => onUpdateMetadata('courseTitle', e.target.value)}
            placeholder="e.g. Electronic Device and Circuit II"
          />
        </div>
        <div className="meta-field">
          <label className="meta-label">Department</label>
          <input
            className="meta-input"
            value={metadata.department || ''}
            onChange={(e) => onUpdateMetadata('department', e.target.value)}
            placeholder="e.g. EEE"
          />
        </div>
        <div className="meta-field">
          <label className="meta-label">Session / Year</label>
          <input
            className="meta-input"
            value={metadata.academicSession || ''}
            onChange={(e) => onUpdateMetadata('academicSession', e.target.value)}
            placeholder="e.g. 2022-2023"
          />
        </div>
        <div className="meta-field">
          <label className="meta-label">Examination</label>
          <input
            className="meta-input"
            value={metadata.examination || ''}
            onChange={(e) => onUpdateMetadata('examination', e.target.value)}
            placeholder="e.g. Final Examination 2023"
          />
        </div>
        <div className="meta-field">
          <label className="meta-label">Examiner Details</label>
          <input
            className="meta-input"
            value={metadata.examinerName || ''}
            onChange={(e) => onUpdateMetadata('examinerName', e.target.value)}
            placeholder="e.g. Shuvo Dev, Lecturer"
          />
        </div>
      </div>

      {/* Real-time Verification & Arithmetic Bar */}
      <div className="stats-bar">
        <div className="stat-group">
          <span className="stat-pill success">
            <CheckCircle2 size={14} />
            <span>{stats.verified} Verified Match</span>
          </span>

          {stats.mismatches > 0 ? (
            <span className="stat-pill warning">
              <AlertTriangle size={14} />
              <span>{stats.mismatches} Arithmetic Discrepancies</span>
            </span>
          ) : (
            <span style={{ fontSize: '0.8rem', color: 'var(--success)' }}>
              ✓ All Question Sums Match Stated Totals
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          <span>Class Avg: <strong style={{ color: 'var(--text-primary)' }}>{averageScore}</strong></span>
        </div>
      </div>

      {/* Spreadsheet Table */}
      <div className="table-wrapper">
        <table className="grade-table">
          <thead>
            <tr>
              <th style={{ width: '90px' }}>Code no.</th>
              <th>Q1</th>
              <th>Q2</th>
              <th>Q3</th>
              <th>Q4</th>
              <th>Q5</th>
              <th>Q6</th>
              <th>Q7</th>
              <th>Q8</th>
              <th>Q9</th>
              <th>Q10</th>
              <th style={{ width: '80px' }}>Stated Total</th>
              <th style={{ width: '90px' }}>Calc Sum</th>
              <th style={{ width: '40px' }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {records.map((row, index) => {
              const qVals = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10];
              const calcSum = qVals.reduce((acc, v) => {
                const n = Number(v);
                return !isNaN(n) && v !== '' && v !== null ? acc + n : acc;
              }, 0);

              const statedTot = Number(row.totalMark);
              const isMismatch = !isNaN(statedTot) && statedTot !== calcSum;

              return (
                <tr key={row.id || index} className={isMismatch ? 'row-mismatch' : ''}>
                  {/* Sticky Code No */}
                  <td>
                    <input
                      className="cell-input code-input"
                      value={row.codeNo || ''}
                      onChange={(e) => handleCellChange(row.id, 'codeNo', e.target.value)}
                      placeholder="Code No"
                      inputMode="numeric"
                    />
                  </td>

                  {/* Q1 to Q10 */}
                  {['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'].map((qKey) => (
                    <td key={qKey}>
                      <input
                        className="cell-input"
                        value={row[qKey] !== undefined ? row[qKey] : ''}
                        onChange={(e) => handleCellChange(row.id, qKey, e.target.value)}
                        placeholder="-"
                        inputMode="numeric"
                      />
                    </td>
                  ))}

                  {/* Stated Total */}
                  <td>
                    <input
                      className={`cell-input total-input ${isMismatch ? 'mismatch-highlight' : ''}`}
                      value={row.totalMark !== undefined ? row.totalMark : ''}
                      onChange={(e) => handleCellChange(row.id, 'totalMark', e.target.value)}
                      placeholder="Total"
                      inputMode="numeric"
                    />
                  </td>

                  {/* Calculated Sum Indicator */}
                  <td>
                    {isMismatch ? (
                      <button
                        className="btn-icon"
                        style={{
                          background: 'rgba(239, 68, 68, 0.2)',
                          color: '#f87171',
                          borderColor: 'var(--danger)',
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.4rem',
                          cursor: 'pointer'
                        }}
                        onClick={() => handleFixTotal(row.id, calcSum)}
                        title={`Mismatch! Q-sum is ${calcSum}, paper says ${statedTot}. Click to sync to ${calcSum}.`}
                      >
                        ⚠ {calcSum}
                      </button>
                    ) : (
                      <span
                        style={{
                          color: 'var(--success)',
                          fontFamily: 'var(--font-mono)',
                          fontSize: '0.8rem',
                          fontWeight: 600
                        }}
                      >
                        ✓ {calcSum}
                      </span>
                    )}
                  </td>

                  {/* Delete row */}
                  <td>
                    <button
                      className="btn-icon"
                      onClick={() => onDeleteRow(row.id)}
                      title="Delete Student Row"
                      style={{ padding: '0.25rem', color: 'var(--text-muted)' }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
