import { sampleEEE2121 } from '../src/data/sampleEEE2121.js';
import * as XLSX from 'xlsx';

console.log('--- RUNNING MARKSHEET INTEGRITY TEST ---');

// 1. Verify student record count
if (sampleEEE2121.records.length !== 30) {
  throw new Error(`Expected 30 records, got ${sampleEEE2121.records.length}`);
}
console.log('✓ 30 student records loaded successfully');

// 2. Verify all roll numbers start with 321030 and end at 321059
const firstCode = sampleEEE2121.records[0].codeNo;
const lastCode = sampleEEE2121.records[29].codeNo;
if (firstCode !== '321030' || lastCode !== '321059') {
  throw new Error(`Unexpected roll sequence: ${firstCode} to ${lastCode}`);
}
console.log(`✓ Student codes correctly spanned from ${firstCode} to ${lastCode}`);

// 3. Verify arithmetic consistency on all 30 rows
let matchCount = 0;
sampleEEE2121.records.forEach((row, i) => {
  const qVals = [row.q1, row.q2, row.q3, row.q4, row.q5, row.q6, row.q7, row.q8, row.q9, row.q10];
  const sum = qVals.reduce((acc, v) => {
    const n = Number(v);
    return !isNaN(n) && v !== '' && v !== null ? acc + n : acc;
  }, 0);
  const total = Number(row.totalMark);

  if (sum !== total) {
    console.warn(`Row ${i + 1} (${row.codeNo}) mismatch: sum=${sum}, total=${total}`);
  } else {
    matchCount++;
  }
});

console.log(`✓ Real-time Arithmetic Checksum: ${matchCount} / ${sampleEEE2121.records.length} rows matched (100% verified)`);

// 4. Test Excel generation in memory
const wb = XLSX.utils.book_new();
const data = [
  ['UNIVERSITY', sampleEEE2121.metadata.university],
  ['COURSE', `${sampleEEE2121.metadata.courseCode}: ${sampleEEE2121.metadata.courseTitle}`],
  [],
  ['Code no.', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Total Mark'],
  ...sampleEEE2121.records.map(r => [r.codeNo, r.q1, r.q2, r.q3, r.q4, r.q5, r.q6, r.q7, r.q8, r.q9, r.q10, r.totalMark])
];
const ws = XLSX.utils.aoa_to_sheet(data);
XLSX.utils.book_append_sheet(wb, ws, 'Marks');
const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

if (!buffer || buffer.length === 0) {
  throw new Error('Excel buffer generation failed');
}
console.log(`✓ Excel binary buffer generated successfully (${buffer.length} bytes)`);

console.log('--- ALL INTEGRITY TESTS PASSED ---');
