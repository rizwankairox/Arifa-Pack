// Small text helpers used by the page markup (safe on the server and in the browser).

/** 7 → "07" */
export const pad2 = (n: number) => String(n).padStart(2, '0');

/** 1 → "1 product", 3 → "3 products" */
export const plural = (n: number, word = 'product') => `${n} ${n === 1 ? word : `${word}s`}`;
