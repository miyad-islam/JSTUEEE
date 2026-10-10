import * as XLSX from 'xlsx';

/**
 * Exports university marksheet data to a structured .xlsx Excel workbook
 * @param {Object} metadata Course and university metadata
 * @param {Array} records Student mark rows
 * @param {string} customFilename Optional custom filename
 */
export function exportMarksheetToExcel(metadata, records, customFilename) {
  const wb = XLSX.utils.book_new();

  // Prepare header rows
  const headerData = [
    [metadata.university || 'UNIVERSITY DETAILED MARK SHEET'],
    [`Academic Session: ${metadata.academicSession || '2022-2023'}   |   Year & Semester: ${metadata.yearSemester || '2nd Year 1st Semester'}`],
    [`Examination: ${metadata.examination || 'Final Examination 2023'}   |   ${metadata.sheetType || 'Detailed Mark Sheet'}`],
    [`Department: ${metadata.department || 'EEE'}   |   Course Code: ${metadata.courseCode || 'EEE 2121'}   |   Title: ${metadata.courseTitle || 'Electronic Device and Circuit II'}`],
    [`Examiner: ${metadata.examinerName || ''} (${metadata.examinerDesignation || ''})   |   Date: ${metadata.signDate || ''}`],
    [] // blank row before table
  ];

  // Column titles
  const tableHeaders = [
    'Code no.',
    'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10',
    'Stated Total',
    'Calculated Sum',
    'Verification Status'
  ];

  headerData.push(tableHeaders);

  // Populate data rows
  records.forEach((row) => {
    const qValues = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10];
    const calcSum = qValues.reduce((acc, val) => {
      const num = Number(val);
      return !isNaN(num) && val !== '' && val !== null ? acc + num : acc;
    }, 0);

    const statedTot = Number(row.totalMark);
    const isMatched = !isNaN(statedTot) && statedTot === calcSum;

    headerData.push([
      row.codeNo || '',
      row.q1 !== '' && row.q1 !== undefined ? Number(row.q1) : '',
      row.q2 !== '' && row.q2 !== undefined ? Number(row.q2) : '',
      row.q3 !== '' && row.q3 !== undefined ? Number(row.q3) : '',
      row.q4 !== '' && row.q4 !== undefined ? Number(row.q4) : '',
      row.q5 !== '' && row.q5 !== undefined ? Number(row.q5) : '',
      row.q6 !== '' && row.q6 !== undefined ? Number(row.q6) : '',
      row.q7 !== '' && row.q7 !== undefined ? Number(row.q7) : '',
      row.q8 !== '' && row.q8 !== undefined ? Number(row.q8) : '',
      row.q9 !== '' && row.q9 !== undefined ? Number(row.q9) : '',
      row.q10 !== '' && row.q10 !== undefined ? Number(row.q10) : '',
      !isNaN(statedTot) ? statedTot : row.totalMark || '',
      calcSum,
      isMatched ? 'VERIFIED' : `MISMATCH (Diff: ${calcSum - (isNaN(statedTot) ? 0 : statedTot)})`
    ]);
  });

  // Add Summary row
  headerData.push([]);
  const validTotals = records
    .map(r => Number(r.totalMark))
    .filter(n => !isNaN(n));
  const avg = validTotals.length ? (validTotals.reduce((a, b) => a + b, 0) / validTotals.length).toFixed(1) : 0;
  const max = validTotals.length ? Math.max(...validTotals) : 0;
  const min = validTotals.length ? Math.min(...validTotals) : 0;

  headerData.push([
    `Total Students: ${records.length}`,
    '', '', '', '', '', '', '', '', '',
    'Class Average:',
    avg,
    `Max: ${max}`,
    `Min: ${min}`
  ]);

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(headerData);

  // Set column widths
  ws['!cols'] = [
    { wch: 14 }, // Code no
    { wch: 7 },  // Q1
    { wch: 7 },  // Q2
    { wch: 7 },  // Q3
    { wch: 7 },  // Q4
    { wch: 7 },  // Q5
    { wch: 7 },  // Q6
    { wch: 7 },  // Q7
    { wch: 7 },  // Q8
    { wch: 7 },  // Q9
    { wch: 7 },  // Q10
    { wch: 14 }, // Stated Total
    { wch: 16 }, // Calculated Sum
    { wch: 22 }  // Verification Status
  ];

  // Append sheet and trigger download
  const courseCodeClean = (metadata.courseCode || 'MarkSheet').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = customFilename || `${courseCodeClean}_Detailed_Mark_Sheet.xlsx`;

  XLSX.utils.book_append_sheet(wb, ws, 'Detailed Mark Sheet');
  XLSX.writeFile(wb, filename);

  return filename;
}
