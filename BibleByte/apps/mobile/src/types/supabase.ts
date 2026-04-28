export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type UUID = string;
type Timestamp = string;
type DateString = string;
type TimeString = string;

type Relationship = {
  foreignKeyName: string;
  columns: string[];
  isOneToOne: boolean;
  referencedRelation: string;
  referencedColumns: string[];
};

export type Database = {
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: Timestamp;
          event_name:
            | "onboarding_started"
            | "onboarding_completed"
            | "lesson_started"
            | "lesson_completed"
            | "streak_updated"
            | "notification_opened"
            | "snippet_viewed"
            | "verse_saved"
            | "verse_unsaved"
            | "verse_shared"
            | "reminder_scheduled"
            | "reminder_disabled"
            | "verse_highlighted"
            | "verse_unhighlighted"
            | "reference_jumped"
            | "reading_resumed";
          id: UUID;
          metadata: Json | null;
          user_id: UUID | null;
        };
        Insert: {
          created_at?: Timestamp;
          event_name:
            | "onboarding_started"
            | "onboarding_completed"
            | "lesson_started"
            | "lesson_completed"
            | "streak_updated"
            | "notification_opened"
            | "snippet_viewed"
            | "verse_saved"
            | "verse_unsaved"
            | "verse_shared"
            | "reminder_scheduled"
            | "reminder_disabled"
            | "verse_highlighted"
            | "verse_unhighlighted"
            | "reference_jumped"
            | "reading_resumed";
          id?: UUID;
          metadata?: Json | null;
          user_id?: UUID | null;
        };
        Update: {
          created_at?: Timestamp;
          event_name?:
            | "onboarding_started"
            | "onboarding_completed"
            | "lesson_started"
            | "lesson_completed"
            | "streak_updated"
            | "notification_opened"
            | "snippet_viewed"
            | "verse_saved"
            | "verse_unsaved"
            | "verse_shared"
            | "reminder_scheduled"
            | "reminder_disabled"
            | "verse_highlighted"
            | "verse_unhighlighted"
            | "reference_jumped"
            | "reading_resumed";
          id?: UUID;
          metadata?: Json | null;
          user_id?: UUID | null;
        };
        Relationships: [
          {
            foreignKeyName: "analytics_events_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      bible_books: {
        Row: {
          id: UUID;
          name: string;
          order_index: number;
          testament: "old" | "new";
          book_group:
            | "pentateuch"
            | "historical"
            | "wisdom"
            | "major_prophets"
            | "minor_prophets"
            | "gospels"
            | "acts_history"
            | "pauline_letters"
            | "general_letters"
            | "apocalyptic"
            | null;
        };
        Insert: {
          id?: UUID;
          name: string;
          order_index: number;
          testament: "old" | "new";
          book_group?:
            | "pentateuch"
            | "historical"
            | "wisdom"
            | "major_prophets"
            | "minor_prophets"
            | "gospels"
            | "acts_history"
            | "pauline_letters"
            | "general_letters"
            | "apocalyptic"
            | null;
        };
        Update: {
          id?: UUID;
          name?: string;
          order_index?: number;
          testament?: "old" | "new";
          book_group?:
            | "pentateuch"
            | "historical"
            | "wisdom"
            | "major_prophets"
            | "minor_prophets"
            | "gospels"
            | "acts_history"
            | "pauline_letters"
            | "general_letters"
            | "apocalyptic"
            | null;
        };
        Relationships: [];
      };
      bible_chapters: {
        Row: {
          book_id: UUID;
          chapter_number: number;
          id: UUID;
        };
        Insert: {
          book_id: UUID;
          chapter_number: number;
          id?: UUID;
        };
        Update: {
          book_id?: UUID;
          chapter_number?: number;
          id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "bible_chapters_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "bible_books";
            referencedColumns: ["id"];
          }
        ];
      };
      bible_verses: {
        Row: {
          chapter_id: UUID;
          id: UUID;
          is_placeholder: boolean;
          translation: "NIV";
          verse_number: number;
          verse_text: string;
        };
        Insert: {
          chapter_id: UUID;
          id?: UUID;
          is_placeholder?: boolean;
          translation?: "NIV";
          verse_number: number;
          verse_text: string;
        };
        Update: {
          chapter_id?: UUID;
          id?: UUID;
          is_placeholder?: boolean;
          translation?: "NIV";
          verse_number?: number;
          verse_text?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bible_verses_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "bible_chapters";
            referencedColumns: ["id"];
          }
        ];
      };
      daily_bytes: {
        Row: {
          created_at: Timestamp;
          date: DateString;
          estimated_minutes: number;
          id: UUID;
          is_placeholder: boolean;
          prayer_prompt: string;
          reflection_question: string;
          summary: string;
          translation: "NIV";
          verse_reference: string;
          verse_text: string;
        };
        Insert: {
          created_at?: Timestamp;
          date: DateString;
          estimated_minutes: number;
          id?: UUID;
          is_placeholder?: boolean;
          prayer_prompt: string;
          reflection_question: string;
          summary: string;
          translation?: "NIV";
          verse_reference: string;
          verse_text: string;
        };
        Update: {
          created_at?: Timestamp;
          date?: DateString;
          estimated_minutes?: number;
          id?: UUID;
          is_placeholder?: boolean;
          prayer_prompt?: string;
          reflection_question?: string;
          summary?: string;
          translation?: "NIV";
          verse_reference?: string;
          verse_text?: string;
        };
        Relationships: [];
      };
      notification_schedules: {
        Row: {
          created_at: Timestamp;
          enabled: boolean;
          id: UUID;
          reminder_time: TimeString;
          timezone: string;
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: {
          created_at?: Timestamp;
          enabled?: boolean;
          id?: UUID;
          reminder_time: TimeString;
          timezone: string;
          updated_at?: Timestamp;
          user_id: UUID;
        };
        Update: {
          created_at?: Timestamp;
          enabled?: boolean;
          id?: UUID;
          reminder_time?: TimeString;
          timezone?: string;
          updated_at?: Timestamp;
          user_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "notification_schedules_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      reading_positions: {
        Row: {
          book_id: UUID;
          chapter_id: UUID;
          id: UUID;
          updated_at: Timestamp;
          user_id: UUID;
          verse_id: UUID | null;
        };
        Insert: {
          book_id: UUID;
          chapter_id: UUID;
          id?: UUID;
          updated_at?: Timestamp;
          user_id: UUID;
          verse_id?: UUID | null;
        };
        Update: {
          book_id?: UUID;
          chapter_id?: UUID;
          id?: UUID;
          updated_at?: Timestamp;
          user_id?: UUID;
          verse_id?: UUID | null;
        };
        Relationships: [
          {
            foreignKeyName: "reading_positions_book_id_fkey";
            columns: ["book_id"];
            isOneToOne: false;
            referencedRelation: "bible_books";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_positions_chapter_id_fkey";
            columns: ["chapter_id"];
            isOneToOne: false;
            referencedRelation: "bible_chapters";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_positions_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reading_positions_verse_id_fkey";
            columns: ["verse_id"];
            isOneToOne: false;
            referencedRelation: "bible_verses";
            referencedColumns: ["id"];
          }
        ];
      };
      verse_highlights: {
        Row: {
          color: "sage" | "amber" | "blush" | "sky";
          created_at: Timestamp;
          id: UUID;
          updated_at: Timestamp;
          user_id: UUID;
          verse_id: UUID;
        };
        Insert: {
          color: "sage" | "amber" | "blush" | "sky";
          created_at?: Timestamp;
          id?: UUID;
          updated_at?: Timestamp;
          user_id: UUID;
          verse_id: UUID;
        };
        Update: {
          color?: "sage" | "amber" | "blush" | "sky";
          created_at?: Timestamp;
          id?: UUID;
          updated_at?: Timestamp;
          user_id?: UUID;
          verse_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "verse_highlights_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "verse_highlights_verse_id_fkey";
            columns: ["verse_id"];
            isOneToOne: false;
            referencedRelation: "bible_verses";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_verses: {
        Row: {
          created_at: Timestamp;
          id: UUID;
          user_id: UUID;
          verse_id: UUID;
        };
        Insert: {
          created_at?: Timestamp;
          id?: UUID;
          user_id: UUID;
          verse_id: UUID;
        };
        Update: {
          created_at?: Timestamp;
          id?: UUID;
          user_id?: UUID;
          verse_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "saved_verses_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_verses_verse_id_fkey";
            columns: ["verse_id"];
            isOneToOne: false;
            referencedRelation: "bible_verses";
            referencedColumns: ["id"];
          }
        ];
      };
      streaks: {
        Row: {
          current_streak: number;
          id: UUID;
          last_completed_on: DateString | null;
          longest_streak: number;
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: {
          current_streak?: number;
          id?: UUID;
          last_completed_on?: DateString | null;
          longest_streak?: number;
          updated_at?: Timestamp;
          user_id: UUID;
        };
        Update: {
          current_streak?: number;
          id?: UUID;
          last_completed_on?: DateString | null;
          longest_streak?: number;
          updated_at?: Timestamp;
          user_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_daily_progress: {
        Row: {
          completed_at: Timestamp | null;
          created_at: Timestamp;
          daily_byte_id: UUID;
          id: UUID;
          reflection_text: string | null;
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: {
          completed_at?: Timestamp | null;
          created_at?: Timestamp;
          daily_byte_id: UUID;
          id?: UUID;
          reflection_text?: string | null;
          updated_at?: Timestamp;
          user_id: UUID;
        };
        Update: {
          completed_at?: Timestamp | null;
          created_at?: Timestamp;
          daily_byte_id?: UUID;
          id?: UUID;
          reflection_text?: string | null;
          updated_at?: Timestamp;
          user_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "user_daily_progress_daily_byte_id_fkey";
            columns: ["daily_byte_id"];
            isOneToOne: false;
            referencedRelation: "daily_bytes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_daily_progress_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_preferences: {
        Row: {
          analytics_opt_in: boolean;
          created_at: Timestamp;
          daily_reminder_time: TimeString;
          goal: string;
          id: UUID;
          preferred_topics: string[];
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: {
          analytics_opt_in?: boolean;
          created_at?: Timestamp;
          daily_reminder_time: TimeString;
          goal: string;
          id?: UUID;
          preferred_topics?: string[];
          updated_at?: Timestamp;
          user_id: UUID;
        };
        Update: {
          analytics_opt_in?: boolean;
          created_at?: Timestamp;
          daily_reminder_time?: TimeString;
          goal?: string;
          id?: UUID;
          preferred_topics?: string[];
          updated_at?: Timestamp;
          user_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_profiles: {
        Row: {
          created_at: Timestamp;
          display_name: string | null;
          id: UUID;
          updated_at: Timestamp;
          user_id: UUID;
        };
        Insert: {
          created_at?: Timestamp;
          display_name?: string | null;
          id?: UUID;
          updated_at?: Timestamp;
          user_id: UUID;
        };
        Update: {
          created_at?: Timestamp;
          display_name?: string | null;
          id?: UUID;
          updated_at?: Timestamp;
          user_id?: UUID;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      handle_lesson_completion: {
        Args: {
          p_completed_at: Timestamp;
          p_daily_byte_id: UUID;
          p_user_id: UUID;
        };
        Returns: undefined;
      };
      request_account_deletion: {
        Args: {
          p_user_id: UUID;
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
