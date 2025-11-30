export interface Database {
  public: {
    Tables: {
      feedback_requests: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          question: string;
          context?: string;
          media_type?: 'photo' | 'text';
          media_url?: string;
          roast_mode?: boolean;
          visibility?: 'public' | 'private';
          created_at: string;
          response_count?: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          question: string;
          context?: string;
          media_type?: 'photo' | 'text';
          media_url?: string;
          roast_mode?: boolean;
          visibility?: 'public' | 'private';
          created_at?: string;
          response_count?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          question?: string;
          context?: string;
          media_type?: 'photo' | 'text';
          media_url?: string;
          roast_mode?: boolean;
          visibility?: 'public' | 'private';
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
          rating?: number;
          tone?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          reviewer_id: string;
          feedback: string;
          rating?: number;
          tone?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          reviewer_id?: string;
          feedback?: string;
          rating?: number;
          tone?: string;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          credits: number;
          is_reviewer: boolean;
          created_at: string;
          display_name?: string | null;
          email?: string | null;
        };
        Insert: {
          id: string;
          credits?: number;
          is_reviewer?: boolean;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          credits?: number;
          is_reviewer?: boolean;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
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
  };
}