export function numberToWordsINR(amount: number): string {
  const rounded = Math.round(amount);
  if (rounded === 0) return 'Zero Rupees Only';

  const singleDigits = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n < 20) return singleDigits[n];
    const t = Math.floor(n / 10);
    const rem = n % 10;
    return tens[t] + (rem > 0 ? ' ' + singleDigits[rem] : '');
  }

  function convertThreeDigits(n: number): string {
    const h = Math.floor(n / 100);
    const rem = n % 100;
    let res = '';
    if (h > 0) {
      res += singleDigits[h] + ' Hundred';
      if (rem > 0) res += ' and ';
    }
    if (rem > 0) {
      res += convertTwoDigits(rem);
    }
    return res;
  }

  let n = rounded;
  let words = '';

  const crores = Math.floor(n / 10000000);
  n %= 10000000;

  const lakhs = Math.floor(n / 100000);
  n %= 100000;

  const thousands = Math.floor(n / 1000);
  n %= 1000;

  const hundreds = n;

  if (crores > 0) {
    words += convertTwoDigits(crores) + ' Crore ';
  }
  if (lakhs > 0) {
    words += convertTwoDigits(lakhs) + ' Lakh ';
  }
  if (thousands > 0) {
    words += convertTwoDigits(thousands) + ' Thousand ';
  }
  if (hundreds > 0) {
    words += convertThreeDigits(hundreds);
  }

  return 'Rupees ' + words.trim() + ' Only';
}
