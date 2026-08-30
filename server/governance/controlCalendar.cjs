'use strict';

const MONTHS = Object.freeze({ monthly: 1, quarterly: 3, semiannual: 6, annual: 12 });

function invalid(message) { const error = new Error(message); error.code = 'CONTROL_CALENDAR_INVALID'; error.status = 422; throw error; }
function parseDate(value, name) { const parsed = new Date(value); if (!Number.isFinite(parsed.getTime())) invalid(`${name} must be an ISO date`); return parsed; }
function addMonths(value, months) { const result = new Date(value); result.setUTCMonth(result.getUTCMonth() + months); return result; }

function buildControlTestingCalendar(input = {}) {
  const asOf = parseDate(input.asOf, 'asOf');
  if (!Array.isArray(input.controls) || !input.controls.length || input.controls.length > 1000) invalid('controls must contain 1 to 1000 items');
  const dueSoonDays = Number.isInteger(input.dueSoonDays) ? input.dueSoonDays : 30;
  if (dueSoonDays < 1 || dueSoonDays > 180) invalid('dueSoonDays must be between 1 and 180');
  const seen = new Set();
  const items = input.controls.map((control, index) => {
    const id = String(control.id || '').trim(), ownerId = String(control.ownerId || '').trim();
    const frequency = String(control.frequency || '').toLowerCase(), risk = String(control.risk || '').toLowerCase();
    if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(id) || seen.has(id)) invalid(`controls[${index}].id is invalid or duplicated`);
    if (!ownerId) invalid(`controls[${index}].ownerId is required`);
    if (!MONTHS[frequency]) invalid(`controls[${index}].frequency is invalid`);
    if (!['low', 'medium', 'high', 'critical'].includes(risk)) invalid(`controls[${index}].risk is invalid`);
    seen.add(id);
    const lastTestedAt = parseDate(control.lastTestedAt, `controls[${index}].lastTestedAt`), nextDue = addMonths(lastTestedAt, MONTHS[frequency]);
    const daysUntilDue = Math.ceil((nextDue - asOf) / 86400000);
    const status = daysUntilDue < 0 ? 'overdue' : daysUntilDue <= dueSoonDays ? 'due_soon' : 'scheduled';
    const priority = status === 'overdue' || risk === 'critical' ? 'critical' : status === 'due_soon' || risk === 'high' ? 'high' : risk;
    return { id, ownerId, frequency, risk, lastTestedAt: lastTestedAt.toISOString(), nextDueAt: nextDue.toISOString(), daysUntilDue, status, priority, humanAssignmentRequired: true };
  }).sort((a, b) => a.daysUntilDue - b.daysUntilDue || a.id.localeCompare(b.id));
  return { schemaVersion: 1, asOf: asOf.toISOString(), dueSoonDays, items, summary: { total: items.length, overdue: items.filter(x => x.status === 'overdue').length, dueSoon: items.filter(x => x.status === 'due_soon').length }, automatedControlConclusion: false };
}

module.exports = { buildControlTestingCalendar };
