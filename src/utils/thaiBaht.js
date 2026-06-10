/**
 * Converts a number into Thai Baht text.
 * Example: 123.45 -> "หนึ่งร้อยยี่สิบสามบาทสี่สิบห้าสตางค์"
 * Example: 100.00 -> "หนึ่งร้อยบาทถ้วน"
 * 
 * @param {number|string} numberInput - The number to convert
 * @returns {string} The Thai text representation
 */
export function thaiBaht(numberInput) {
  if (numberInput === null || numberInput === undefined || isNaN(numberInput)) {
    return 'ศูนย์บาทถ้วน';
  }

  // Convert to float and round to 2 decimal places to prevent float issues
  const number = Math.round(parseFloat(numberInput) * 100) / 100;
  
  if (number === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const numberStr = number.toString();
  const parts = numberStr.split('.');
  const bahtPart = parts[0];
  const satangPart = parts[1] ? parts[1].padEnd(2, '0') : '00';

  let bahtText = '';
  let satangText = '';

  // Helper to convert up to 7 digits (under 10 million)
  function convertSection(numStr) {
    const digits = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    const positions = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
    let text = '';
    const len = numStr.length;

    for (let i = 0; i < len; i++) {
      const digit = parseInt(numStr.charAt(i), 10);
      const pos = len - i - 1;

      if (digit !== 0) {
        // Special case for 'เอ็ด' (1) at the units place
        if (pos === 0 && digit === 1 && len > 1) {
          // Check if previous digit was 0 (e.g. 101 -> หนึ่งร้อยเอ็ด, but 1,000,001 -> หนึ่งล้านเอ็ด)
          // Actually in Thai, if len > 1, the unit digit 1 is always 'เอ็ด'
          text += 'เอ็ด';
        }
        // Special case for 'สิบ' (10)
        else if (pos === 1 && digit === 1) {
          text += 'สิบ';
        }
        // Special case for 'ยี่สิบ' (20)
        else if (pos === 1 && digit === 2) {
          text += 'ยี่สิบ';
        }
        else {
          text += digits[digit] + positions[pos];
        }
      }
    }
    return text;
  }

  // Handle Baht part (can be larger than 10 million)
  if (bahtPart && bahtPart !== '0') {
    let tempBaht = bahtPart;
    let sections = [];
    
    // Split into 6-digit sections from right to left
    while (tempBaht.length > 0) {
      if (tempBaht.length > 6) {
        sections.push(tempBaht.slice(-6));
        tempBaht = tempBaht.slice(0, -6);
      } else {
        sections.push(tempBaht);
        tempBaht = '';
      }
    }

    // Convert each section and join with 'ล้าน'
    for (let i = 0; i < sections.length; i++) {
      const secText = convertSection(sections[i]);
      if (secText) {
        if (i === 0) {
          bahtText = secText + bahtText;
        } else {
          // If we are at a higher section (e.g., millions, billions)
          // we append 'ล้าน' at the end of this section
          bahtText = secText + 'ล้าน' + bahtText;
        }
      } else if (i > 0 && sections[i-1] !== '000000') {
        // Handle millions place connector when intermediate section is 0
        bahtText = 'ล้าน' + bahtText;
      }
    }
    bahtText += 'บาท';
  } else {
    bahtText = 'ศูนย์บาท';
  }

  // Handle Satang part
  if (satangPart && satangPart !== '00') {
    satangText = convertSection(satangPart) + 'สตางค์';
    // If we have satang, we don't have "ถ้วน"
    return (bahtPart === '0' ? '' : bahtText) + satangText;
  } else {
    return bahtText + 'ถ้วน';
  }
}
