/**
 * Hand-written stand-in for the Supabase-generated schema types.
 * Once the schema exists in a real project, replace this file with:
 *   npx supabase gen types typescript --project-id <id> > src/types/database.ts
 */

export type StatsVisibility = "public" | "friends_only" | "private";
export type FriendshipStatus = "pending" | "accepted" | "declined" | "blocked";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string;
          avatar_url: string | null;
          stats_visibility: StatsVisibility;
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name: string;
          avatar_url?: string | null;
          stats_visibility?: StatsVisibility;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      leagues: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
        };
        Update: Partial<Database["public"]["Tables"]["leagues"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "leagues_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      series: {
        Row: {
          id: string;
          profile_id: string;
          league_id: string | null;
          bowled_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          league_id?: string | null;
          bowled_at: string;
        };
        Update: Partial<Database["public"]["Tables"]["series"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "series_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "series_league_id_fkey";
            columns: ["league_id"];
            referencedRelation: "leagues";
            referencedColumns: ["id"];
          },
        ];
      };
      games: {
        Row: {
          id: string;
          series_id: string;
          profile_id: string;
          game_number: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          series_id: string;
          profile_id: string;
          game_number: number;
        };
        Update: Partial<Database["public"]["Tables"]["games"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "games_series_id_fkey";
            columns: ["series_id"];
            referencedRelation: "series";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "games_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      frames: {
        Row: {
          id: string;
          game_id: string;
          frame_number: number;
          rolls: number[];
          created_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          frame_number: number;
          rolls: number[];
        };
        Update: Partial<Database["public"]["Tables"]["frames"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "frames_game_id_fkey";
            columns: ["game_id"];
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
        ];
      };
      friendships: {
        Row: {
          id: string;
          requester_id: string;
          addressee_id: string;
          status: FriendshipStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          requester_id: string;
          addressee_id: string;
          status?: FriendshipStatus;
        };
        Update: Partial<Database["public"]["Tables"]["friendships"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "friendships_requester_id_fkey";
            columns: ["requester_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "friendships_addressee_id_fkey";
            columns: ["addressee_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {};
    Functions: {
      get_friend_stats: {
        Args: { target_profile_id: string };
        Returns: {
          average: number;
          high_game: number;
          high_series: number;
          strike_percentage: number;
          spare_percentage: number;
          open_frame_percentage: number;
        };
      };
    };
  };
}
