export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          display_name: string | null;
          email: string | null;
          is_judge: boolean;
          is_admin: boolean;
          country: string | null;
          age_range: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url: string | null;
          credits: number;
          onboarding_completed: boolean;
          judge_qualification_date: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          email?: string | null;
          is_judge?: boolean;
          is_admin?: boolean;
          country?: string | null;
          age_range?: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender?: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          judge_qualification_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          display_name?: string | null;
          email?: string | null;
          is_judge?: boolean;
          is_admin?: boolean;
          country?: string | null;
          age_range?: '18-24' | '25-34' | '35-44' | '45+' | null;
          gender?: 'male' | 'female' | 'nonbinary' | 'prefer_not_say' | null;
          avatar_url?: string | null;
          credits?: number;
          onboarding_completed?: boolean;
          judge_qualification_date?: string | null;
        };
      };
      feedback_requests: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          question: string;
          context?: string | null;
          media_type?: 'photo' | 'text' | null;
          media_url?: string | null;
          roast_mode?: boolean | null;
          visibility?: 'public' | 'private' | null;
          created_at: string;
          response_count?: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          question: string;
          context?: string | null;
          media_type?: 'photo' | 'text' | null;
          media_url?: string | null;
          roast_mode?: boolean | null;
          visibility?: 'public' | 'private' | null;
          created_at?: string;
          response_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          question?: string;
          context?: string | null;
          media_type?: 'photo' | 'text' | null;
          media_url?: string | null;
          roast_mode?: boolean | null;
          visibility?: 'public' | 'private' | null;
          created_at?: string;
          response_count?: number;
        };
      };
      feedback_responses: {
        Row: {
          id: string;
          request_id: string;
          reviewer_id: string;
          feedback: string;
          rating?: number | null;
          tone?: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          reviewer_id: string;
          feedback: string;
          rating?: number | null;
          tone?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          reviewer_id?: string;
          feedback?: string;
          rating?: number | null;
          tone?: string | null;
          created_at?: string;
        };
      };
      verdict_requests: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          user_id: string;
          status: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory: string | null;
          media_type: 'photo' | 'text' | 'audio';
          media_url: string | null;
          text_content: string | null;
          context: string;
          target_verdict_count: number;
          received_verdict_count: number;
          requested_tone: 'encouraging' | 'honest' | 'brutally_honest' | null;
          is_flagged: boolean;
          flagged_reason: string | null;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          status?: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory?: string | null;
          media_type: 'photo' | 'text' | 'audio';
          media_url?: string | null;
          text_content?: string | null;
          context: string;
          target_verdict_count?: number;
          received_verdict_count?: number;
          requested_tone?: 'encouraging' | 'honest' | 'brutally_honest' | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          status?: 'open' | 'in_progress' | 'closed' | 'cancelled';
          category?: 'appearance' | 'profile' | 'writing' | 'decision';
          subcategory?: string | null;
          media_type?: 'photo' | 'text' | 'audio';
          media_url?: string | null;
          text_content?: string | null;
          context?: string;
          target_verdict_count?: number;
          received_verdict_count?: number;
          is_flagged?: boolean;
          flagged_reason?: string | null;
          deleted_at?: string | null;
        };
      };
      verdict_responses: {
        Row: {
          id: string;
          created_at: string;
          request_id: string;
          judge_id: string;
          rating: number | null;
          feedback: string;
          tone: 'honest' | 'constructive' | 'encouraging';
          voice_url: string | null;
          is_flagged: boolean;
          flagged_reason: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          request_id: string;
          judge_id: string;
          rating?: number | null;
          feedback: string;
          tone: 'honest' | 'constructive' | 'encouraging';
          voice_url?: string | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          request_id?: string;
          judge_id?: string;
          rating?: number | null;
          feedback?: string;
          tone?: 'honest' | 'constructive' | 'encouraging';
          voice_url?: string | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
        };
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          stripe_session_id: string | null;
          stripe_payment_intent_id: string | null;
          type: 'purchase' | 'adjustment' | 'refund';
          credits_delta: number;
          amount_cents: number;
          currency: string;
          status: 'pending' | 'completed' | 'failed';
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          type: 'purchase' | 'adjustment' | 'refund';
          credits_delta: number;
          amount_cents: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          stripe_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          type?: 'purchase' | 'adjustment' | 'refund';
          credits_delta?: number;
          amount_cents?: number;
          currency?: string;
          status?: 'pending' | 'completed' | 'failed';
        };
      };
      judge_sessions: {
        Row: {
          id: string;
          judge_id: string;
          started_at: string;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          judge_id: string;
          started_at?: string;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          judge_id?: string;
          started_at?: string;
          ended_at?: string | null;
        };
      };
      user_credits: {
        Row: {
          id: string;
          user_id: string;
          balance: number;
          earned_total: number;
          spent_total: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
        };
      };
      judge_reputation: {
        Row: {
          id: string;
          user_id: string;
          total_judgments: number;
          consensus_rate: number;
          tier: string;
          current_streak: number;
          longest_streak: number;
          last_judgment_date: string;
          is_verified?: boolean;
          helpfulness_score?: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_judgments?: number;
          consensus_rate?: number;
          tier?: string;
          current_streak?: number;
          longest_streak?: number;
          last_judgment_date?: string;
          is_verified?: boolean;
          helpfulness_score?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_judgments?: number;
          consensus_rate?: number;
          tier?: string;
          current_streak?: number;
          longest_streak?: number;
          last_judgment_date?: string;
          is_verified?: boolean;
          helpfulness_score?: number;
        };
      };
      credit_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          description: string;
          created_at: string;
          type?: string;
          source?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          transaction_type: string;
          description: string;
          created_at?: string;
          type?: string;
          source?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          transaction_type?: string;
          description?: string;
          created_at?: string;
          type?: string;
          source?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      award_credits: {
        Args: {
          target_user_id: string;
          credit_amount: number;
          transaction_type: string;
          transaction_source: string;
          transaction_source_id?: string | null;
          transaction_description?: string | null;
        };
        Returns: boolean;
      };
      spend_credits: {
        Args: {
          target_user_id: string;
          credit_amount: number;
          transaction_source: string;
          transaction_source_id?: string | null;
          transaction_description?: string | null;
        };
        Returns: boolean;
      };
      update_judge_reputation: {
        Args: {
          target_user_id: string;
          consensus_match?: boolean | null;
          helpfulness_rating?: number | null;
          quality_score?: number | null;
        };
        Returns: void;
      };
    };
    Enums: Record<string, never>;
  };
}

// Helper types
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type VerdictRequest = Database['public']['Tables']['verdict_requests']['Row'];
export type VerdictResponse = Database['public']['Tables']['verdict_responses']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
