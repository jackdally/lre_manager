export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidProgramCode = (code: string): boolean => {
  const codeRegex = /^[A-Z]{3}\.\d{4}$/;
  return codeRegex.test(code);
};

export const isValidAmount = (amount: string): boolean => {
  const amountRegex = /^\d+(\.\d{1,2})?$/;
  return amountRegex.test(amount) && parseFloat(amount) > 0;
};

export const isValidDate = (date: string): boolean => {
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj.getTime());
};

export const validateRequired = (value: any): boolean => {
  return value !== null && value !== undefined && value !== "";
};
