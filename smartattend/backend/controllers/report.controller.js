const Attendance = require('../models/Attendance');
const AttendanceSession = require('../models/AttendanceSession');

// Helper to build the base query
const buildQuery = (req, baseMatch = {}) => {
  const { startDate, endDate, status } = req.query;
  const query = { teacherId: req.user._id, ...baseMatch };

  if (startDate || endDate) {
    query.markedAt = {};
    if (startDate) query.markedAt.$gte = new Date(startDate);
    if (endDate) query.markedAt.$lte = new Date(endDate);
  }

  if (status) {
    query.status = status;
  }

  return query;
};

exports.getSessionReport = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = buildQuery(req, { sessionId });
    const skip = (page - 1) * limit;

    let records = await Attendance.find(query)
      .populate('studentId', 'fullName studentId rollNumber')
      .populate('subjectId', 'name')
      .sort({ markedAt: -1 });

    // Handle Search filter in memory since we are searching populated fields
    const search = req.query.search ? req.query.search.toLowerCase() : '';
    if (search) {
      records = records.filter(r => 
        r.studentId && (
          r.studentId.fullName.toLowerCase().includes(search) || 
          (r.studentId.studentId && r.studentId.studentId.toLowerCase().includes(search))
        )
      );
    }

    const total = records.length;
    const paginated = records.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginated,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getClassReport = async (req, res) => {
  try {
    const { classId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = buildQuery(req, { classId });
    const skip = (page - 1) * limit;

    let records = await Attendance.find(query)
      .populate('studentId', 'fullName studentId rollNumber')
      .populate('subjectId', 'name')
      .populate('sessionId', 'startedAt expiresAt')
      .sort({ markedAt: -1 });

    const search = req.query.search ? req.query.search.toLowerCase() : '';
    if (search) {
      records = records.filter(r => 
        r.studentId && (
          r.studentId.fullName.toLowerCase().includes(search) || 
          (r.studentId.studentId && r.studentId.studentId.toLowerCase().includes(search))
        )
      );
    }

    const total = records.length;
    const paginated = records.slice(skip, skip + limit);

    res.json({
      success: true,
      data: paginated,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.exportReportCSV = async (req, res) => {
  try {
    const query = buildQuery(req);
    
    // Optional filters from frontend
    if (req.query.classId) query.classId = req.query.classId;
    if (req.query.sessionId) query.sessionId = req.query.sessionId;

    let records = await Attendance.find(query)
      .populate('studentId', 'fullName studentId rollNumber')
      .populate('subjectId', 'name')
      .sort({ markedAt: -1 });

    const search = req.query.search ? req.query.search.toLowerCase() : '';
    if (search) {
      records = records.filter(r => 
        r.studentId && (
          r.studentId.fullName.toLowerCase().includes(search) || 
          (r.studentId.studentId && r.studentId.studentId.toLowerCase().includes(search))
        )
      );
    }

    // Build CSV String
    let csv = 'Date,Time,Student Name,Student ID,Roll Number,Subject,Status,Face Verified,Liveness,Score,Failure Reason\n';
    
    records.forEach(r => {
      if (!r.studentId) return;
      const date = new Date(r.markedAt).toLocaleDateString();
      const time = new Date(r.markedAt).toLocaleTimeString();
      const name = `"${r.studentId.fullName}"`;
      const sid = r.studentId.studentId || '';
      const roll = r.studentId.rollNumber || '';
      const subject = `"${r.subjectId?.name || ''}"`;
      const status = r.status;
      const face = r.faceVerified ? 'Yes' : 'No';
      const live = r.livenessVerified ? 'Yes' : 'No';
      const score = r.verificationScore ? r.verificationScore.toFixed(4) : '';
      const reason = `"${r.failureReason || ''}"`;

      csv += `${date},${time},${name},${sid},${roll},${subject},${status},${face},${live},${score},${reason}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
    res.status(200).send(csv);

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error during export' });
  }
};
