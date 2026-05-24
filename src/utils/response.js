'use strict';

exports.success = (res, data, message = 'Success', statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, data });

exports.paginated = (res, data, meta, message = 'Success') =>
  res.status(200).json({ success: true, message, data, meta });

exports.error = (res, message = 'Internal Server Error', statusCode = 500, errors = null) => {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
};
