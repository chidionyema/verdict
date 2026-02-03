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
          is_admin?: boolean;
          is_judge?: boolean;
          created_at: string;
          display_name?: string | null;
          email?: string | null;
        };
        Insert: {
          id: string;
          credits?: number;
          is_reviewer?: boolean;
          is_admin?: boolean;
          is_judge?: boolean;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
        };
        Update: {
          id?: string;
          credits?: number;
          is_reviewer?: boolean;
          is_admin?: boolean;
          is_judge?: boolean;
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
          reputation_score?: number;
          total_reviews?: number;
          reviewer_status?: 'active' | 'inactive' | 'suspended';
          last_active?: string;
          consensus_rate?: number;
          last_calibration?: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
          reputation_score?: number;
          total_reviews?: number;
          reviewer_status?: 'active' | 'inactive' | 'suspended';
          last_active?: string;
          consensus_rate?: number;
          last_calibration?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
          reputation_score?: number;
          total_reviews?: number;
          reviewer_status?: 'active' | 'inactive' | 'suspended';
          last_active?: string;
          consensus_rate?: number;
          last_calibration?: string;
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
      verdict_requests: {
        Row: {
          id: string;
          user_id: string;
          request_tier: 'community' | 'standard' | 'pro';
          received_verdict_count: number;
          status?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_tier?: 'community' | 'standard' | 'pro';
          received_verdict_count?: number;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_tier?: 'community' | 'standard' | 'pro';
          received_verdict_count?: number;
          status?: string;
          created_at?: string;
        };
      };
      verdict_responses: {
        Row: {
          id: string;
          request_id: string;
          reviewer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          reviewer_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          reviewer_id?: string;
          created_at?: string;
        };
      };
      expert_verifications: {
        Row: {
          id: string;
          user_id: string;
          job_title: string;
          company: string;
          industry: string;
          verification_status: 'pending' | 'verified' | 'rejected';
          verified_at?: string;
          verified_by?: string;
          rejection_reason?: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_title: string;
          company: string;
          industry: string;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verified_at?: string;
          verified_by?: string;
          rejection_reason?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_title?: string;
          company?: string;
          industry?: string;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verified_at?: string;
          verified_by?: string;
          rejection_reason?: string;
          created_at?: string;
        };
      };
      reviewer_ratings: {
        Row: {
          id: string;
          reviewer_id: string;
          request_id: string;
          response_id: string;
          helpfulness_rating: number;
          quality_score: number;
          rated_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          reviewer_id: string;
          request_id: string;
          response_id: string;
          helpfulness_rating: number;
          quality_score: number;
          rated_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          reviewer_id?: string;
          request_id?: string;
          response_id?: string;
          helpfulness_rating?: number;
          quality_score?: number;
          rated_by?: string;
          created_at?: string;
        };
      };
      reputation_history: {
        Row: {
          id: string;
          user_id: string;
          event_type: string;
          old_score: number;
          new_score: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: string;
          old_score: number;
          new_score: number;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: string;
          old_score?: number;
          new_score?: number;
          reason?: string;
          created_at?: string;
        };
      };
      pricing_tiers: {
        Row: {
          id: string;
          name: string;
          credits_required: number;
        };
        Insert: {
          id?: string;
          name: string;
          credits_required: number;
        };
        Update: {
          id?: string;
          name?: string;
          credits_required?: number;
        };
      };
      comparison_requests: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
        };
      };
      user_actions: {
        Row: {
          id: string;
          user_id: string;
          action_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action_type: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action_type?: string;
          created_at?: string;
        };
      };
      folders: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          created_at?: string;
        };
      };
      user_tier_info: {
        Row: {
          id: string;
          user_id: string;
          tier: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tier: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          tier?: string;
          created_at?: string;
        };
      };
      user_onboarding: {
        Row: {
          id: string;
          user_id: string;
          completed_at: string;
          selected_category: string | null;
          selected_request_type: string | null;
          interested_in_judging: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          completed_at: string;
          selected_category?: string | null;
          selected_request_type?: string | null;
          interested_in_judging?: boolean | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          completed_at?: string;
          selected_category?: string | null;
          selected_request_type?: string | null;
          interested_in_judging?: boolean | null;
          created_at?: string;
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