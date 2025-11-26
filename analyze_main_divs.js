const fs = require('fs');

const content = fs.readFileSync('/Users/roseonyema/documents/code/verdict/app/judge/page.tsx', 'utf8');
const lines = content.split('\n');

// Focus on the main return section (line 300 onwards)
let stack = [];
let inMainReturn = false;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Start tracking from line 300 (main return)
  if (lineNum >= 300) {
    inMainReturn = true;
  }
  
  if (inMainReturn) {
    // Check for opening divs
    const openMatches = line.match(/<div[^>]*>/g);
    if (openMatches) {
      openMatches.forEach(() => {
        stack.push({ line: lineNum, content: line.trim() });
      });
    }
    
    // Check for closing divs
    const closeMatches = line.match(/<\/div>/g);
    if (closeMatches) {
      closeMatches.forEach(() => {
        if (stack.length > 0) {
          stack.pop();
        }
      });
    }
  }
});

console.log('Unclosed divs in main return section (line 300+):');
stack.forEach((item, index) => {
  console.log(`${index + 1}. Line ${item.line}: ${item.content}`);
});

console.log(`\nTotal unclosed divs in main section: ${stack.length}`);