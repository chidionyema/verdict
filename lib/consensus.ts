import OpenAI from 'openai';
import type { VerdictResponse } from './database.types';

interface ConsensusResult {
  synthesis: string;
  confidence_score: number;
  agreement_level: 'high' | 'medium' | 'low';
  key_themes: string[];
  conflicts: ConflictArea[];
  recommendations: Recommendation[];
  expert_breakdown: ExpertSummary[];
}

interface ConflictArea {
  topic: string;
  positions: string[];
  resolution: string;
}

interface Recommendation {
  action: string;
  confidence: number;
  reasoning: string;
  expert_support: number; // How many experts support this
}

interface ExpertSummary {
  expert_title: string;
  key_points: string[];
  stance: 'positive' | 'neutral' | 'negative';
  confidence: number;
}

export class ConsensusEngine {
  private openai: OpenAI;

  constructor() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Synthesize multiple expert verdicts into professional consensus
   */
  async synthesizeVerdicts(
    verdicts: VerdictResponse[],
    requestContext: string,
    category: string
  ): Promise<ConsensusResult> {
    if (verdicts.length < 2) {
      throw new Error('Need at least 2 verdicts for consensus analysis');
    }

    // Prepare expert inputs for analysis
    const expertInputs = verdicts.map((verdict, index) => ({
      expert_id: `Expert ${index + 1}`,
      expert_title: this.getExpertTitle(verdict),
      rating: verdict.rating,
      feedback: verdict.feedback,
      tone: verdict.tone
    }));

    const prompt = this.buildConsensusPrompt(expertInputs, requestContext, category);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4', // Use GPT-4 for high-quality analysis
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(category)
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent analysis
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from OpenAI');
      }

      const result = JSON.parse(response) as ConsensusResult;
      
      // Validate and sanitize the result
      return this.validateConsensusResult(result, expertInputs.length);
      
    } catch (error) {
      console.error('Consensus analysis failed:', error);
      throw new Error('Failed to generate consensus analysis');
    }
  }

  private getExpertTitle(verdict: VerdictResponse): string {
    // This would typically come from the reviewer's expert verification
    // For now, return a generic title
    return 'Verified Expert';
  }

  private getSystemPrompt(category: string): string {
    return `You are a professional consensus analyst specializing in ${category} decisions. 
Your role is to synthesize multiple expert opinions into clear, actionable insights.

Key responsibilities:
- Identify areas of expert agreement and disagreement
- Extract key themes and actionable recommendations  
- Assign confidence scores based on expert consensus
- Provide professional-grade analysis that justifies premium consultation fees
- Maintain objectivity while highlighting the strongest evidence-based positions

Response format: Always respond with valid JSON matching the ConsensusResult interface.
Confidence scores: Use 0.0-1.0 scale (1.0 = unanimous expert agreement)
Agreement levels: 'high' (80%+ agreement), 'medium' (60-80%), 'low' (<60%)`;
  }

  private buildConsensusPrompt(
    expertInputs: Array<{
      expert_id: string;
      expert_title: string;
      rating: number | null;
      feedback: string;
      tone: string;
    }>,
    requestContext: string,
    category: string
  ): string {
    const expertsSection = expertInputs.map(expert => 
      `**${expert.expert_id}** (${expert.expert_title})
Rating: ${expert.rating || 'N/A'}/10
Feedback: ${expert.feedback}
Tone: ${expert.tone}`
    ).join('\n\n');

    return `
CONSENSUS ANALYSIS REQUEST

**Context:** ${requestContext}
**Category:** ${category}

**Expert Opinions:**
${expertsSection}

**Analysis Required:**
Please provide a comprehensive consensus analysis in JSON format with the following structure:

{
  "synthesis": "Professional summary combining all expert insights (200-300 words)",
  "confidence_score": 0.85,
  "agreement_level": "high|medium|low", 
  "key_themes": ["theme1", "theme2", "theme3"],
  "conflicts": [
    {
      "topic": "Area of disagreement",
      "positions": ["Expert position 1", "Expert position 2"],
      "resolution": "How to reconcile this conflict"
    }
  ],
  "recommendations": [
    {
      "action": "Specific action to take",
      "confidence": 0.9,
      "reasoning": "Why this is recommended",
      "expert_support": 3
    }
  ],
  "expert_breakdown": [
    {
      "expert_title": "Expert 1 title",
      "key_points": ["point1", "point2"],
      "stance": "positive|neutral|negative", 
      "confidence": 0.8
    }
  ]
}

Focus on:
1. Professional-grade analysis that justifies premium consultation
2. Clear actionable recommendations with confidence scores
3. Transparent handling of expert disagreements
4. Evidence-based synthesis that respects all expert input
`;
  }

  private validateConsensusResult(result: ConsensusResult, expertCount: number): ConsensusResult {
    // Ensure confidence scores are valid
    result.confidence_score = Math.max(0, Math.min(1, result.confidence_score));
    
    // Validate agreement level matches confidence score
    if (result.confidence_score >= 0.8 && result.agreement_level !== 'high') {
      result.agreement_level = 'high';
    } else if (result.confidence_score >= 0.6 && result.agreement_level === 'low') {
      result.agreement_level = 'medium';
    }

    // Ensure we have expert breakdown for each expert
    if (result.expert_breakdown.length !== expertCount) {
      console.warn(`Expert breakdown count (${result.expert_breakdown.length}) doesn't match expert count (${expertCount})`);
    }

    // Sanitize recommendations
    result.recommendations = result.recommendations.map(rec => ({
      ...rec,
      confidence: Math.max(0, Math.min(1, rec.confidence)),
      expert_support: Math.max(0, Math.min(expertCount, rec.expert_support))
    }));

    return result;
  }

  /**
   * Check if a request qualifies for consensus analysis
   * (Pro tier feature - requires expert-level reviews)
   */
  static shouldGenerateConsensus(requestTier: string, verdictCount: number): boolean {
    return requestTier === 'pro' && verdictCount >= 2;
  }
}

export type { ConsensusResult, ConflictArea, Recommendation, ExpertSummary };