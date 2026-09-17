export const money = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

export const numberWords = (value: number): string => {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (value < 20) return ones[value];
  if (value < 100) return tens[Math.floor(value / 10)] + (value % 10 ? " " + ones[value % 10] : "");
  if (value < 1000) return ones[Math.floor(value / 100)] + " Hundred" + (value % 100 ? " " + numberWords(value % 100) : "");
  if (value < 100000) return numberWords(Math.floor(value / 1000)) + " Thousand" + (value % 1000 ? " " + numberWords(value % 1000) : "");
  if (value < 10000000) return numberWords(Math.floor(value / 100000)) + " Lakh" + (value % 100000 ? " " + numberWords(value % 100000) : "");
  return numberWords(Math.floor(value / 10000000)) + " Crore" + (value % 10000000 ? " " + numberWords(value % 10000000) : "");
};

export const amountInWords = (amount: number) => {
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);
  return "Indian Rupees " + numberWords(whole) + (paise ? " and " + numberWords(paise) + " Paise" : "");
};