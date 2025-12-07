export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: []
      }
      creator_earnings: {
        Row: {
          amount_cents: number
          created_at: string
          creator_id: string
          id: string
          paid_at: string | null
          payout_method: string | null
          platform_fee_cents: number
          purchase_id: string
          status: string
          style_pack_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          creator_id: string
          id?: string
          paid_at?: string | null
          payout_method?: string | null
          platform_fee_cents: number
          purchase_id: string
          status?: string
          style_pack_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          creator_id?: string
          id?: string
          paid_at?: string | null
          payout_method?: string | null
          platform_fee_cents?: number
          purchase_id?: string
          status?: string
          style_pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creator_earnings_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "style_pack_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "creator_earnings_style_pack_id_fkey"
            columns: ["style_pack_id"]
            isOneToOne: false
            referencedRelation: "user_style_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content_text: string
          created_at: string
          id: string
          is_favorite: boolean
          platform: string
          project_id: string
        }
        Insert: {
          content_text: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          platform: string
          project_id: string
        }
        Update: {
          content_text?: string
          created_at?: string
          id?: string
          is_favorite?: boolean
          platform?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_attempts: {
        Row: {
          created_at: string
          id: string
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_attempts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          project_id: string | null
          prompt: string | null
          result: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          project_id?: string | null
          prompt?: string | null
          result?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_shares: {
        Row: {
          acquired_at: string
          created_at: string
          id: string
          nft_id: string
          owner_address: string
          shares: number
        }
        Insert: {
          acquired_at?: string
          created_at?: string
          id?: string
          nft_id: string
          owner_address: string
          shares: number
        }
        Update: {
          acquired_at?: string
          created_at?: string
          id?: string
          nft_id?: string
          owner_address?: string
          shares?: number
        }
        Relationships: [
          {
            foreignKeyName: "nft_shares_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      nft_transactions: {
        Row: {
          created_at: string
          from_address: string | null
          id: string
          nft_id: string
          price_matic: number | null
          shares: number
          to_address: string
          transaction_hash: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          from_address?: string | null
          id?: string
          nft_id: string
          price_matic?: number | null
          shares: number
          to_address: string
          transaction_hash: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          from_address?: string | null
          id?: string
          nft_id?: string
          price_matic?: number | null
          shares?: number
          to_address?: string
          transaction_hash?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nft_transactions_nft_id_fkey"
            columns: ["nft_id"]
            isOneToOne: false
            referencedRelation: "nfts"
            referencedColumns: ["id"]
          },
        ]
      }
      nfts: {
        Row: {
          contract_address: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          minted_at: string
          network: string
          title: string
          token_id: number
          total_shares: number
          transaction_hash: string
          user_id: string
          video_id: string
        }
        Insert: {
          contract_address: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          title: string
          token_id: number
          total_shares?: number
          transaction_hash: string
          user_id: string
          video_id: string
        }
        Update: {
          contract_address?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          minted_at?: string
          network?: string
          title?: string
          token_id?: number
          total_shares?: number
          transaction_hash?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          original_text: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          original_text: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          original_text?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      style_pack_purchases: {
        Row: {
          buyer_id: string
          id: string
          price_paid_cents: number
          purchased_at: string
          style_pack_id: string
        }
        Insert: {
          buyer_id: string
          id?: string
          price_paid_cents: number
          purchased_at?: string
          style_pack_id: string
        }
        Update: {
          buyer_id?: string
          id?: string
          price_paid_cents?: number
          purchased_at?: string
          style_pack_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "style_pack_purchases_style_pack_id_fkey"
            columns: ["style_pack_id"]
            isOneToOne: false
            referencedRelation: "user_style_packs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_style_packs: {
        Row: {
          created_at: string
          creator_id: string
          description: string | null
          download_count: number
          id: string
          is_active: boolean
          lora_url: string | null
          name: string
          preview_images: string[]
          price_cents: number
          tags: string[]
          training_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          lora_url?: string | null
          name: string
          preview_images?: string[]
          price_cents: number
          tags?: string[]
          training_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          description?: string | null
          download_count?: number
          id?: string
          is_active?: boolean
          lora_url?: string | null
          name?: string
          preview_images?: string[]
          price_cents?: number
          tags?: string[]
          training_status?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
