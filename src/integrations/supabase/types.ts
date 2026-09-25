export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: string;
          can_manage_ads: boolean;
          can_manage_offers: boolean;
          can_manage_users: boolean;
          created_at: string;
          whatsapp_phone: string | null;
          whatsapp_verified: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          role?: string;
          can_manage_ads?: boolean;
          can_manage_offers?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          role?: string;
          can_manage_ads?: boolean;
          can_manage_offers?: boolean;
          can_manage_users?: boolean;
          created_at?: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
        };
        Relationships: [];
      };

      ads: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          price: number | null;
          location: string | null;
          whatsapp_phone: string | null;
          created_at: string;
          updated_at: string;
          photo_urls: string[] | null;
          business_id: string | null;
          auction_enabled: boolean;
          auction_start_price: number | null;
          auction_end_at: string | null;
          reference: string | null;
          allow_negotiation: boolean;
          status: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          location?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          photo_urls?: string[] | null;
          business_id?: string | null;
          auction_enabled?: boolean;
          auction_start_price?: number | null;
          auction_end_at?: string | null;
          reference?: string | null;
          allow_negotiation?: boolean;
          status?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          location?: string | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          photo_urls?: string[] | null;
          business_id?: string | null;
          auction_enabled?: boolean;
          auction_start_price?: number | null;
          auction_end_at?: string | null;
          reference?: string | null;
          allow_negotiation?: boolean;
          status?: string | null;
        };
        Relationships: [];
      };

      businesses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          category: string | null;
          city: string | null;
          address: string | null;
          whatsapp_phone: string | null;
          photo_urls: string[] | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          address?: string | null;
          whatsapp_phone?: string | null;
          photo_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          city?: string | null;
          address?: string | null;
          whatsapp_phone?: string | null;
          photo_urls?: string[] | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };

      favorites: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string | null;
          service_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id?: string | null;
          service_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_id?: string | null;
          service_id?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          is_read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          type?: string;
          is_read?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };

      profiles: {
        Row: {
          id: string;
          email: string;
          whatsapp_phone: string | null;
          whatsapp_verified: boolean;
          created_at: string;
          first_name: string | null;
          last_name: string | null;
          city: string | null;
          stuff_id: string | null;
        };
        Insert: {
          id: string;
          email: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          city?: string | null;
          stuff_id?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          whatsapp_phone?: string | null;
          whatsapp_verified?: boolean;
          created_at?: string;
          first_name?: string | null;
          last_name?: string | null;
          city?: string | null;
          stuff_id?: string | null;
        };
        Relationships: [];
      };

      reports: {
        Row: {
          id: string;
          user_id: string;
          ad_id: string | null;
          service_id: string | null;
          reason: string;
          description: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          ad_id?: string | null;
          service_id?: string | null;
          reason: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          ad_id?: string | null;
          service_id?: string | null;
          reason?: string;
          description?: string | null;
          status?: string;
          created_at?: string;
        };
        Relationships: [];
      };

      services: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          category: string | null;
          price: number | null;
          whatsapp_phone: string | null;
          created_at: string;
          updated_at: string;
          reference: string | null;
          allow_negotiation: boolean;
          location: string | null;
          status: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          reference?: string | null;
          allow_negotiation?: boolean;
          location?: string | null;
          status?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          whatsapp_phone?: string | null;
          created_at?: string;
          updated_at?: string;
          reference?: string | null;
          allow_negotiation?: boolean;
          location?: string | null;
          status?: string | null;
        };
        Relationships: [];
      };
    };

    Views: {
      [_ in never]: never;
    };

    Functions: {
      [_ in never]: never;
    };

    Enums: {
      [_ in never]: never;
    };

    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions]["Row"]
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions]["Insert"]
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions]["Update"]
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends {
  schema: keyof Database;
}
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never;