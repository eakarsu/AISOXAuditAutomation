const express = require('express');

const router = express.Router();

router.get('/', (_req, res) => {
  res.json({
    feature: 'Key Report Completeness',
    summary: { reportPopulation: 42, exceptions: 5, completenessScore: 88, owner: 'SOX PMO' },
    reports: [
      { name: 'User Access Listing', system: 'ERP', exception: 'Missing extract hash', severity: 'Medium' },
      { name: 'Journal Entry Population', system: 'GL', exception: 'Period filter mismatch', severity: 'High' },
      { name: 'Change Ticket Export', system: 'ITSM', exception: 'Approver column blank', severity: 'Medium' },
    ],
    procedures: [
      'Reconcile report row counts to source-system control totals.',
      'Store query parameters, run timestamp, and preparer attestation.',
      'Require independent reviewer signoff for high-severity exceptions.',
    ],
  });
});

module.exports = router;
