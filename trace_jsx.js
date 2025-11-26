const fs = require('fs');

const content = fs.readFileSync('/Users/roseonyema/documents/code/verdict/app/judge/page.tsx', 'utf8');
const lines = content.split('\n');

let stack = [];
let inQueueSection = false;

lines.forEach((line, index) => {
  const lineNum = index + 1;
  
  // Start tracking from Queue comment
  if (line.includes('/* Queue */')) {
    inQueueSection = true;
    console.log(`${lineNum}: Starting Queue section`);
  }
  
  // Track JSX patterns in queue section
  if (inQueueSection) {
    if (line.includes('? (')) {
      stack.push({ type: 'ternary_open', line: lineNum, content: line.trim() });
      console.log(`${lineNum}: TERNARY OPEN - ${line.trim()}`);
    }
    if (line.includes(') : (')) {
      console.log(`${lineNum}: TERNARY MID - ${line.trim()}`);
    }
    if (line.includes(')}')) {
      if (stack.length > 0) {
        const opened = stack.pop();
        console.log(`${lineNum}: TERNARY CLOSE - ${line.trim()} (matches line ${opened.line})`);
      } else {
        console.log(`${lineNum}: TERNARY CLOSE - ${line.trim()} (NO MATCH!)`);
      }
    }
    
    // Stop at My Verdicts section
    if (line.includes('/* My Verdicts Link */')) {
      inQueueSection = false;
      console.log(`${lineNum}: Ending Queue section`);
      if (stack.length > 0) {
        console.log('UNCLOSED TERNARIES:');
        stack.forEach(item => console.log(`  Line ${item.line}: ${item.content}`));
      }
    }
  }
});