import { v4 as uuidv4 } from 'uuid';
import { Verdict } from './store';

const sampleFeedback: Record<string, { positive: string[]; constructive: string[] }> = {
  appearance: {
    positive: [
      "You look professional and approachable! The outfit works well for a business setting.",
      "Great color choice - it really complements your skin tone.",
      "Your smile looks genuine and warm, which makes a great first impression.",
      "The overall vibe is confident without being intimidating. Perfect balance!",
      "Love the attention to detail - the accessories really pull the look together.",
    ],
    constructive: [
      "The lighting could be better - try facing a window for natural light.",
      "Consider a more fitted jacket for a sharper professional look.",
      "The background is a bit distracting - a plain wall would work better.",
      "Your posture could be more open - try relaxing your shoulders a bit.",
      "The colors are nice but consider adding a pop of color with an accessory.",
    ],
  },
  professional: {
    positive: [
      "Your resume is well-structured and easy to scan quickly.",
      "Strong action verbs make your achievements stand out.",
      "The LinkedIn summary is engaging and tells your story well.",
      "Clear progression shown in your experience - very compelling!",
      "Your skills section is well-organized and relevant.",
    ],
    constructive: [
      "Consider quantifying more of your achievements with numbers.",
      "The font choice could be more modern - try a sans-serif option.",
      "Your email could be more concise - aim for 3-4 paragraphs max.",
      "Add more specific examples to back up your claims.",
      "The formatting could use some work for better readability.",
    ],
  },
  creative: {
    positive: [
      "The composition draws the eye exactly where it should go.",
      "Your unique style really shines through in this piece.",
      "The color palette creates a great mood and atmosphere.",
      "Technical execution is solid - you clearly know your craft.",
      "This evokes real emotion - that's the mark of good creative work.",
    ],
    constructive: [
      "The concept is strong but the execution could be refined.",
      "Consider the negative space more - it feels a bit crowded.",
      "The color balance could use some adjustment for better harmony.",
      "Try experimenting with different perspectives on this idea.",
      "Good foundation but could benefit from more polish in the details.",
    ],
  },
  decisions: {
    positive: [
      "This seems like a well-thought-out choice with clear benefits.",
      "Your reasoning is sound and you've considered the key factors.",
      "Go for it - the upside clearly outweighs the potential downsides.",
      "This aligns well with what you've described as your priorities.",
      "Solid decision - you've done your due diligence here.",
    ],
    constructive: [
      "Have you considered the long-term implications of this choice?",
      "Might be worth getting more information before committing.",
      "The pros and cons seem pretty balanced - take your time.",
      "Consider what you'd regret more: doing this or not doing it.",
      "Have you explored all the alternatives? There might be other options.",
    ],
  },
};

const demographics = [
  { ageRange: "18-24", gender: "Female", location: "CA, USA" },
  { ageRange: "25-34", gender: "Male", location: "NY, USA" },
  { ageRange: "35-44", gender: "Female", location: "TX, USA" },
  { ageRange: "25-34", gender: "Non-binary", location: "WA, USA" },
  { ageRange: "45-54", gender: "Male", location: "FL, USA" },
  { ageRange: "18-24", gender: "Male", location: "IL, USA" },
  { ageRange: "35-44", gender: "Female", location: "CO, USA" },
  { ageRange: "25-34", gender: "Female", location: "MA, USA" },
  { ageRange: "45-54", gender: "Male", location: "AZ, USA" },
  { ageRange: "25-34", gender: "Non-binary", location: "OR, USA" },
];

export function generateMockVerdict(category: string, index: number): Verdict {
  const isPositive = Math.random() > 0.3;
  const categoryKey = category in sampleFeedback ? category : 'appearance';
  const feedbackArray = isPositive
    ? sampleFeedback[categoryKey].positive
    : sampleFeedback[categoryKey].constructive;

  return {
    id: uuidv4(),
    judgeId: uuidv4(),
    rating: isPositive
      ? Math.floor(Math.random() * 3) + 7
      : Math.floor(Math.random() * 3) + 4,
    feedback: feedbackArray[Math.floor(Math.random() * feedbackArray.length)],
    tone: isPositive ? 'encouraging' : 'constructive',
    demographics: demographics[index % demographics.length],
    createdAt: new Date(),
  };
}
