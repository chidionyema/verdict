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
          judge_training_completed: boolean;
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
          judge_training_completed?: boolean;
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
          judge_training_completed?: boolean;
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
          request_tier: 'community' | 'standard' | 'pro' | 'enterprise';
          payment_amount: number;
          payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id: string | null;
          paid_at: string | null;
          expert_only: boolean;
          priority_queue: boolean;
          ai_synthesis: boolean;
          follow_up_enabled: boolean;
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
          request_tier?: 'community' | 'standard' | 'pro' | 'enterprise';
          payment_amount?: number;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id?: string | null;
          paid_at?: string | null;
          expert_only?: boolean;
          priority_queue?: boolean;
          ai_synthesis?: boolean;
          follow_up_enabled?: boolean;
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
          requested_tone?: 'encouraging' | 'honest' | 'brutally_honest' | null;
          is_flagged?: boolean;
          flagged_reason?: string | null;
          deleted_at?: string | null;
          request_tier?: 'community' | 'standard' | 'pro' | 'enterprise';
          payment_amount?: number;
          payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
          payment_id?: string | null;
          paid_at?: string | null;
          expert_only?: boolean;
          priority_queue?: boolean;
          ai_synthesis?: boolean;
          follow_up_enabled?: boolean;
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
          reputation_score: number;
          reviewer_status: 'active' | 'probation' | 'calibration_required';
          last_calibration: string | null;
          total_reviews: number;
          consensus_rate: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
          reputation_score?: number;
          reviewer_status?: 'active' | 'probation' | 'calibration_required';
          last_calibration?: string | null;
          total_reviews?: number;
          consensus_rate?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          balance?: number;
          earned_total?: number;
          spent_total?: number;
          reputation_score?: number;
          reviewer_status?: 'active' | 'probation' | 'calibration_required';
          last_calibration?: string | null;
          total_reviews?: number;
          consensus_rate?: number;
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
      judge_verifications: {
        Row: {
          id: string;
          user_id: string;
          linkedin_url: string;
          status: 'pending' | 'approved' | 'rejected';
          submitted_at: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          verification_type: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          linkedin_url: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          verification_type?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          linkedin_url?: string;
          status?: 'pending' | 'approved' | 'rejected';
          submitted_at?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          verification_type?: string;
          notes?: string | null;
          created_at?: string;
        };
      };
      admin_notifications: {
        Row: {
          id: string;
          type: string;
          title: string;
          message: string;
          data: any;
          priority: 'low' | 'medium' | 'high' | 'critical';
          read: boolean;
          created_at: string;
          read_at: string | null;
        };
        Insert: {
          id?: string;
          type: string;
          title: string;
          message: string;
          data?: any;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          read?: boolean;
          created_at?: string;
          read_at?: string | null;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: any;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          read?: boolean;
          created_at?: string;
          read_at?: string | null;
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
      expert_verifications: {
        Row: {
          id: string;
          user_id: string;
          verification_type: 'linkedin' | 'portfolio' | 'manual';
          linkedin_url: string | null;
          portfolio_url: string | null;
          job_title: string;
          company: string;
          industry: string;
          years_experience: number | null;
          verification_status: 'pending' | 'verified' | 'rejected';
          verification_data: Json | null;
          verified_at: string | null;
          verified_by: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          verification_type: 'linkedin' | 'portfolio' | 'manual';
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          job_title: string;
          company: string;
          industry: string;
          years_experience?: number | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_data?: Json | null;
          verified_at?: string | null;
          verified_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          verification_type?: 'linkedin' | 'portfolio' | 'manual';
          linkedin_url?: string | null;
          portfolio_url?: string | null;
          job_title?: string;
          company?: string;
          industry?: string;
          years_experience?: number | null;
          verification_status?: 'pending' | 'verified' | 'rejected';
          verification_data?: Json | null;
          verified_at?: string | null;
          verified_by?: string | null;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      reputation_history: {
        Row: {
          id: string;
          user_id: string;
          old_score: number;
          new_score: number;
          old_status: string;
          new_status: string;
          trigger_event: string;
          trigger_id: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          old_score: number;
          new_score: number;
          old_status: string;
          new_status: string;
          trigger_event: string;
          trigger_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          old_score?: number | null;
          new_score?: number | null;
          old_status?: string | null;
          new_status?: string | null;
          trigger_event?: string;
          trigger_id?: string | null;
          notes?: string | null;
          created_at?: string;
        };
      };
      calibration_tests: {
        Row: {
          id: string;
          title: string;
          description: string;
          test_data: Json;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          test_data: Json;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          test_data?: Json;
          active?: boolean;
          created_at?: string;
        };
      };
      calibration_results: {
        Row: {
          id: string;
          user_id: string;
          test_id: string;
          score: number;
          passed: boolean;
          answers: Json;
          time_taken: number | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          test_id: string;
          score: number;
          passed: boolean;
          answers: Json;
          time_taken?: number | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          test_id?: string;
          score?: number;
          passed?: boolean;
          answers?: Json;
          time_taken?: number | null;
          completed_at?: string;
        };
      };
      pricing_tiers: {
        Row: {
          id: string;
          tier: 'community' | 'standard' | 'pro' | 'enterprise';
          display_name: string;
          price_pence: number;
          credits_required: number;
          verdict_count: number;
          features: Json;
          reviewer_requirements: Json;
          turnaround_minutes: number;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tier: 'community' | 'standard' | 'pro' | 'enterprise';
          display_name: string;
          price_pence: number;
          credits_required: number;
          verdict_count: number;
          features: Json;
          reviewer_requirements?: Json;
          turnaround_minutes?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tier?: 'community' | 'standard' | 'pro' | 'enterprise';
          display_name?: string;
          price_pence?: number;
          credits_required?: number;
          verdict_count?: number;
          features?: Json;
          reviewer_requirements?: Json;
          turnaround_minutes?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      payment_transactions: {
        Row: {
          id: string;
          user_id: string;
          request_id: string | null;
          amount_pence: number;
          currency: string;
          payment_method: string;
          stripe_payment_intent_id: string | null;
          stripe_charge_id: string | null;
          status: 'pending' | 'paid' | 'failed' | 'refunded';
          metadata: Json;
          error_message: string | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          request_id?: string | null;
          amount_pence: number;
          currency?: string;
          payment_method: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: 'pending' | 'paid' | 'failed' | 'refunded';
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          request_id?: string | null;
          amount_pence?: number;
          currency?: string;
          payment_method?: string;
          stripe_payment_intent_id?: string | null;
          stripe_charge_id?: string | null;
          status?: 'pending' | 'paid' | 'failed' | 'refunded';
          metadata?: Json;
          error_message?: string | null;
          created_at?: string;
          completed_at?: string | null;
        };
      };
      consensus_analysis: {
        Row: {
          id: string;
          request_id: string;
          synthesis: string;
          confidence_score: number;
          agreement_level: 'high' | 'medium' | 'low';
          key_themes: Json;
          conflicts: Json;
          recommendations: Json;
          expert_breakdown: Json;
          expert_count: number;
          analysis_version: string;
          llm_model: string;
          analysis_tokens: number | null;
          status: 'pending' | 'completed' | 'failed';
          error_message: string | null;
          started_at: string;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          request_id: string;
          synthesis?: string;
          confidence_score?: number;
          agreement_level?: 'high' | 'medium' | 'low';
          key_themes?: Json;
          conflicts?: Json;
          recommendations?: Json;
          expert_breakdown?: Json;
          expert_count: number;
          analysis_version?: string;
          llm_model?: string;
          analysis_tokens?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          request_id?: string;
          synthesis?: string;
          confidence_score?: number;
          agreement_level?: 'high' | 'medium' | 'low';
          key_themes?: Json;
          conflicts?: Json;
          recommendations?: Json;
          expert_breakdown?: Json;
          expert_count?: number;
          analysis_version?: string;
          llm_model?: string;
          analysis_tokens?: number | null;
          status?: 'pending' | 'completed' | 'failed';
          error_message?: string | null;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      comparison_requests: {
        Row: {
          id: string;
          user_id: string;
          question: string;
          category: 'career' | 'lifestyle' | 'business' | 'appearance' | 'general';
          option_a_title: string;
          option_a_description: string;
          option_a_image_url: string | null;
          option_b_title: string;
          option_b_description: string;
          option_b_image_url: string | null;
          decision_context: Json;
          request_tier: 'community' | 'standard' | 'pro';
          target_verdict_count: number;
          status: 'open' | 'in_review' | 'completed' | 'expired' | 'cancelled';
          visibility: 'public' | 'private';
          received_verdict_count: number;
          winner_option: 'A' | 'B' | 'tie' | null;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          question: string;
          category: 'career' | 'lifestyle' | 'business' | 'appearance' | 'general';
          option_a_title: string;
          option_a_description: string;
          option_a_image_url?: string | null;
          option_b_title: string;
          option_b_description: string;
          option_b_image_url?: string | null;
          decision_context: Json;
          request_tier?: 'community' | 'standard' | 'pro';
          target_verdict_count?: number;
          status?: 'open' | 'in_review' | 'completed' | 'expired' | 'cancelled';
          visibility?: 'public' | 'private';
          received_verdict_count?: number;
          winner_option?: 'A' | 'B' | 'tie' | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          expires_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          question?: string;
          category?: 'career' | 'lifestyle' | 'business' | 'appearance' | 'general';
          option_a_title?: string;
          option_a_description?: string;
          option_a_image_url?: string | null;
          option_b_title?: string;
          option_b_description?: string;
          option_b_image_url?: string | null;
          decision_context?: Json;
          request_tier?: 'community' | 'standard' | 'pro';
          target_verdict_count?: number;
          status?: 'open' | 'in_review' | 'completed' | 'expired' | 'cancelled';
          visibility?: 'public' | 'private';
          received_verdict_count?: number;
          winner_option?: 'A' | 'B' | 'tie' | null;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
          expires_at?: string;
        };
      };
      comparison_verdicts: {
        Row: {
          id: string;
          comparison_id: string;
          reviewer_id: string;
          preferred_option: 'A' | 'B' | 'tie';
          reasoning: string;
          confidence_score: number | null;
          option_a_feedback: string | null;
          option_b_feedback: string | null;
          decision_scores: Json | null;
          reviewer_expertise: string | null;
          is_verified_expert: boolean;
          helpfulness_score: number | null;
          was_helpful_vote_count: number;
          was_not_helpful_vote_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          comparison_id: string;
          reviewer_id: string;
          preferred_option: 'A' | 'B' | 'tie';
          reasoning: string;
          confidence_score?: number | null;
          option_a_feedback?: string | null;
          option_b_feedback?: string | null;
          decision_scores?: Json | null;
          reviewer_expertise?: string | null;
          is_verified_expert?: boolean;
          helpfulness_score?: number | null;
          was_helpful_vote_count?: number;
          was_not_helpful_vote_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          comparison_id?: string;
          reviewer_id?: string;
          preferred_option?: 'A' | 'B' | 'tie';
          reasoning?: string;
          confidence_score?: number | null;
          option_a_feedback?: string | null;
          option_b_feedback?: string | null;
          decision_scores?: Json | null;
          reviewer_expertise?: string | null;
          is_verified_expert?: boolean;
          helpfulness_score?: number | null;
          was_helpful_vote_count?: number;
          was_not_helpful_vote_count?: number;
          created_at?: string;
          updated_at?: string;
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
export type ComparisonRequest = Database['public']['Tables']['comparison_requests']['Row'];
export type ComparisonVerdict = Database['public']['Tables']['comparison_verdicts']['Row'];
