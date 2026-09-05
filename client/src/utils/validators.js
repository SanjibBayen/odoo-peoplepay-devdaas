/**
 * Validation utilities for PeoplePay forms and data integrity.
 */

/**
 * Validates standard email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email.trim());
}

/**
 * Validates phone numbers (supports international & Indian numbers).
 * @param {string} phone
 * @returns {boolean}
 */
export function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const cleaned = phone.replace(/[\s\-()]/g, '');
  const re = /^\+?[0-9]{7,15}$/;
  return re.test(cleaned);
}

/**
 * Checks if a value is non-empty.
 * @param {*} value
 * @returns {boolean}
 */
export function isRequired(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

/**
 * Validates password strength (minimum 8 chars, 1 uppercase, 1 lowercase, 1 number).
 * @param {string} password
 * @returns {{ isValid: boolean, message: string }}
 */
export function isStrongPassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, message: 'Password is required.' };
  }
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  return { isValid: true, message: 'Password is strong.' };
}

/**
 * Validates an employee form object.
 * @param {Object} values
 * @returns {Object} map of field errors
 */
export function validateEmployeeForm(values) {
  const errors = {};
  if (!isRequired(values.firstName)) errors.firstName = 'First name is required.';
  if (!isRequired(values.lastName)) errors.lastName = 'Last name is required.';
  if (!isValidEmail(values.email)) errors.email = 'Valid work email is required.';
  if (values.phone && !isValidPhone(values.phone)) {
    errors.phone = 'Valid contact phone number is required.';
  }
  return errors;
}

/**
 * Validates contract form dates and wage.
 * @param {Object} values
 * @returns {Object} map of field errors
 */
export function validateContractForm(values) {
  const errors = {};
  if (!isRequired(values.employeeId)) errors.employeeId = 'Employee selection is required.';
  if (!values.wage || Number(values.wage) <= 0) errors.wage = 'Wage must be greater than 0.';
  if (!isRequired(values.startDate)) errors.startDate = 'Start date is required.';
  if (values.startDate && values.endDate) {
    if (new Date(values.startDate) > new Date(values.endDate)) {
      errors.endDate = 'End date cannot be prior to start date.';
    }
  }
  return errors;
}

export default {
  isValidEmail,
  isValidPhone,
  isRequired,
  isStrongPassword,
  validateEmployeeForm,
  validateContractForm,
};
