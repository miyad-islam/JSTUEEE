/**
 * Robust Normalizer to handle any JSON structure returned by multimodal AI models
 */

export function normalizeMarksheetResponse(rawJson, pageNum = 1) {
  if (!rawJson) return { metadata: {}, records: [] };

  let data = rawJson;
  if (typeof rawJson === 'string') {
    try {
      data = JSON.parse(rawJson);
    } catch (e) {
      console.error('Failed to parse rawJson:', e);
      return { metadata: {}, records: [] };
    }
  }

  // 1. Normalize Metadata
  const metadata = {};
  if (data.university || data.university_name || data.institution) {
    metadata.university = String(data.university || data.university_name || data.institution).trim();
  }
  if (data.academicSession || data.academic_session || data.session) {
    metadata.academicSession = String(data.academicSession || data.academic_session || data.session).trim();
  }
  if (data.yearSemester || data.year_semester) {
    metadata.yearSemester = String(data.yearSemester || data.year_semester).trim();
  } else if (data.year && data.semester) {
    metadata.yearSemester = `${data.year} Year ${data.semester} Semester`;
  }
  if (data.examination || data.exam || data.examination_name) {
    metadata.examination = String(data.examination || data.exam || data.examination_name).trim();
  }
  if (data.department || data.dept) {
    metadata.department = String(data.department || data.dept).trim();
  }
  if (data.courseCode || data.course_code || data.course) {
    metadata.courseCode = String(data.courseCode || data.course_code || data.course).trim();
  }
  if (data.courseTitle || data.course_title || data.title) {
    metadata.courseTitle = String(data.courseTitle || data.course_title || data.title).trim();
  }

  // Examiner info
  if (data.examiner) {
    if (typeof data.examiner === 'object') {
      const parts = [data.examiner.name, data.examiner.designation, data.examiner.university]
        .filter(Boolean)
        .join(', ');
      metadata.examinerName = parts || data.examiner.name || '';
      if (data.examiner.date) metadata.signDate = data.examiner.date;
    } else {
      metadata.examinerName = String(data.examiner);
    }
  } else if (data.examinerName || data.examiner_name) {
    metadata.examinerName = String(data.examinerName || data.examiner_name).trim();
  }

  // 2. Locate Student Rows Array
  let rawList = null;
  if (Array.isArray(data)) {
    rawList = data;
  } else if (Array.isArray(data.records)) {
    rawList = data.records;
  } else if (Array.isArray(data.marks_table)) {
    rawList = data.marks_table;
  } else if (Array.isArray(data.students)) {
    rawList = data.students;
  } else if (Array.isArray(data.marks)) {
    rawList = data.marks;
  } else if (Array.isArray(data.rows)) {
    rawList = data.rows;
  } else if (Array.isArray(data.table)) {
    rawList = data.table;
  } else if (Array.isArray(data.data)) {
    rawList = data.data;
  } else {
    // Check if any property in object is an array of objects
    for (const key of Object.keys(data)) {
      if (Array.isArray(data[key]) && data[key].length > 0 && typeof data[key][0] === 'object') {
        rawList = data[key];
        break;
      }
    }
  }

  if (!rawList || !Array.isArray(rawList)) {
    console.warn('Could not locate student rows array in AI response:', data);
    return { metadata, records: [] };
  }

  // 3. Normalize Each Student Record
  const records = rawList.map((row, idx) => {
    const code = row.codeNo ?? row.code_no ?? row.code ?? row.roll ?? row.roll_no ?? row.student_code ?? row.Code ?? '';

    // Check if questions are nested under obtained_marks or flat
    const marksObj = row.obtained_marks || row.marks || row.questions || row.scores || {};

    const getQ = (num) => {
      const val = marksObj[`q${num}`] ?? marksObj[`Q${num}`] ?? marksObj[String(num)] ??
                  row[`q${num}`] ?? row[`Q${num}`] ?? row[String(num)];
      if (val === null || val === undefined || val === '') return '';
      return val;
    };

    const total = row.totalMark ?? row.total_mark ?? row.total ?? row.total_marks ?? row.Total ?? '';

    return {
      id: `row-p${pageNum}-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      codeNo: String(code).trim(),
      q1: getQ(1),
      q2: getQ(2),
      q3: getQ(3),
      q4: getQ(4),
      q5: getQ(5),
      q6: getQ(6),
      q7: getQ(7),
      q8: getQ(8),
      q9: getQ(9),
      q10: getQ(10),
      totalMark: total !== null && total !== undefined ? String(total).trim() : '',
      page: pageNum
    };
  }).filter((r) => r.codeNo || r.totalMark || r.q1 !== ''); // Filter out empty blank rows

  return { metadata, records };
}
