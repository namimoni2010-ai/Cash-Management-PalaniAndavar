class ApiError extends Error {
  constructor(status, message, code, errors) {
    super(message);
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// "2026-11-05" -> Date at 00:00 UTC
const parseDay = (s) => new Date(`${s}T00:00:00.000Z`);

module.exports = { ApiError, asyncHandler, escapeRegex, parseDay };
