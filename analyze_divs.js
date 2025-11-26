const fs = require('fs');

const content = fs.readFileSync('/Users/roseonyema/documents/code/verdict/app/judge/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let issues = [];

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
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
      } else {
        issues.push(`Line ${lineNum}: Closing div without opening div`);
      }
    });
  }
});

console.log('Unclosed divs:');
stack.forEach((item, index) => {
  console.log(`${index + 1}. Line ${item.line}: ${item.content}`);
});

console.log(`\nTotal unclosed divs: ${stack.length}`);
if (issues.length > 0) {
  console.log('\nIssues:');
  issues.forEach(issue => console.log(issue));
}