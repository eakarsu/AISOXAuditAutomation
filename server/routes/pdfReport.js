const express = require('express');
const PDFDocument = require('pdfkit');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');

const router = express.Router();

// GET /api/reports/pdf/:reportId - Generate PDF for an audit report
router.get('/pdf/:reportId', auth, requireRole('admin', 'auditor', 'management'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM audit_reports WHERE id = $1', [req.params.reportId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Report not found' });
    const report = result.rows[0];

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=audit-report-${report.report_id || report.id}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('SOX Audit Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).font('Helvetica').text(report.title || 'Untitled Report', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown();

    // Horizontal line
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // Report Details
    doc.fontSize(12).font('Helvetica-Bold').text('Report Details');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica');
    const details = [
      ['Report ID', report.report_id],
      ['Type', report.type],
      ['Period', report.period],
      ['Auditor', report.auditor],
      ['Status', report.status],
    ];
    for (const [label, value] of details) {
      if (value) doc.text(`${label}: ${value}`);
    }
    doc.moveDown();

    // Executive Summary
    if (report.executive_summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('Executive Summary');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(report.executive_summary, { align: 'justify' });
      doc.moveDown();
    }

    // AI Summary / Analysis
    if (report.ai_summary) {
      doc.fontSize(12).font('Helvetica-Bold').text('AI Analysis Summary');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(report.ai_summary, { align: 'justify' });
      doc.moveDown();
    }

    // Findings
    if (report.findings) {
      doc.fontSize(12).font('Helvetica-Bold').text('Findings');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(report.findings, { align: 'justify' });
      doc.moveDown();
    }

    // Recommendations
    if (report.recommendations) {
      doc.fontSize(12).font('Helvetica-Bold').text('Recommendations');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').text(report.recommendations, { align: 'justify' });
      doc.moveDown();
    }

    // Footer
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);
    doc.fontSize(8).fillColor('gray').text('This report is confidential and intended for authorized personnel only.', { align: 'center' });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/pdf/deficiency/:deficiencyId - PDF for a specific deficiency
router.get('/pdf/deficiency/:deficiencyId', auth, requireRole('admin', 'auditor'), async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM deficiencies WHERE id = $1', [req.params.deficiencyId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Deficiency not found' });
    const def = result.rows[0];

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=deficiency-${def.deficiency_id || def.id}.pdf`);
    doc.pipe(res);

    doc.fontSize(20).font('Helvetica-Bold').text('SOX Deficiency Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).font('Helvetica').text(`Deficiency: ${def.title}`);
    doc.moveDown(0.3);
    const fields = [
      ['Deficiency ID', def.deficiency_id],
      ['Severity', def.severity],
      ['Classification', def.classification],
      ['Control Reference', def.control_ref],
      ['Owner', def.owner],
      ['Status', def.status],
      ['Workflow State', def.workflow_state],
      ['Identified Date', def.identified_date],
    ];
    for (const [label, value] of fields) {
      if (value) doc.fontSize(10).text(`${label}: ${value}`);
    }
    doc.moveDown();

    if (def.description) {
      doc.fontSize(12).font('Helvetica-Bold').text('Description');
      doc.fontSize(10).font('Helvetica').text(def.description);
      doc.moveDown();
    }
    if (def.remediation_plan) {
      doc.fontSize(12).font('Helvetica-Bold').text('Remediation Plan');
      doc.fontSize(10).font('Helvetica').text(def.remediation_plan);
      doc.moveDown();
    }
    if (def.ai_analysis) {
      doc.fontSize(12).font('Helvetica-Bold').text('AI Analysis');
      doc.fontSize(10).font('Helvetica').text(def.ai_analysis);
    }

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
