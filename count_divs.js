const fs = require('fs');

const content = fs.readFileSync('/Users/roseonyema/documents/code/verdict/app/judge/page.tsx', 'utf8');

// Find all div tags
const openDivs = content.match(/<div[^>]*>/g) || [];
const closeDivs = content.match(/<\/div>/g) || [];

console.log(`Open divs: ${openDivs.length}`);
console.log(`Close divs: ${closeDivs.length}`);
console.log(`Missing close divs: ${openDivs.length - closeDivs.length}`);

// Show line numbers for each
const lines = content.split('\n');
let openCount = 0;
let closeCount = 0;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  if (line.includes('<div')) {
    const matches = line.match(/<div[^>]*>/g);
    if (matches) {
      openCount += matches.length;
      console.log(`Line ${lineNum}: ${matches.length} opening div(s)`);
    }
  }
  if (line.includes('</div>')) {
    const matches = line.match(/<\/div>/g);
    if (matches) {
      closeCount += matches.length;
      console.log(`Line ${lineNum}: ${matches.length} closing div(s)`);
    }
  }
});

console.log(`\nTotal open: ${openCount}, Total close: ${closeCount}`);