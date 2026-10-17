/** Evaluate basic arithmetic without executing JavaScript. */
export function calculateAmount(input: string): string {
  const source = input.replace(/,/g, '').replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/\s/g, '');
  if (!source || source.length > 200) throw new Error('Invalid expression');
  let position = 0;
  function factor(): number {
    if (source[position] === '+' || source[position] === '-') {
      const sign = source[position++] === '-' ? -1 : 1;
      return sign * factor();
    }
    if (source[position] === '(') {
      position++;
      const value = sum();
      if (source[position++] !== ')') throw new Error('Missing closing parenthesis');
      return value;
    }
    const match = source.slice(position).match(/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})/);
    if (!match) throw new Error('Expected a number');
    position += match[0].length;
    return Number(match[0]);
  }
  function product(): number {
    let value = factor();
    while (source[position] === '*' || source[position] === '/') {
      const operator = source[position++];
      const next = factor();
      if (operator === '/' && next === 0) throw new Error('Cannot divide by zero');
      value = operator === '*' ? value * next : value / next;
    }
    return value;
  }
  function sum(): number {
    let value = product();
    while (source[position] === '+' || source[position] === '-') {
      const operator = source[position++];
      const next = product();
      value = operator === '+' ? value + next : value - next;
    }
    return value;
  }
  const value = sum();
  const cents = Math.round((value + Number.EPSILON) * 100);
  if (position !== source.length || !Number.isFinite(value) || !Number.isSafeInteger(cents) || cents <= 0) throw new Error('Invalid amount');
  return (cents / 100).toFixed(2);
}
