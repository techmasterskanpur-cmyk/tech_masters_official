/**
 * asyncHandler.js
 * ───────────────
 * Wraps an async Express route handler so that any rejected promise
 * is automatically forwarded to Express's next(err) error handler.
 * This eliminates the need for try/catch in every controller.
 *
 * Usage:
 *   exports.myRoute = asyncHandler(async (req, res) => {
 *       const data = await SomeModel.find();
 *       res.json(data);
 *   });
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
