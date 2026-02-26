export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'student' | 'business'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role: 'student' | 'business'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'student' | 'business'
          created_at?: string
          updated_at?: string
        }
      }
      businesses: {
        Row: {
          id: string
          profile_id: string
          name: string
          description: string
          category: 'food' | 'retail' | 'services' | 'healthcare' | 'education' | 'other'
          address: string
          city: string
          province: string
          postal_code: string
          latitude: number
          longitude: number
          phone: string | null
          email: string | null
          website: string | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          name: string
          description: string
          category: 'food' | 'retail' | 'services' | 'healthcare' | 'education' | 'other'
          address: string
          city: string
          province: string
          postal_code: string
          latitude: number
          longitude: number
          phone?: string | null
          email?: string | null
          website?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          name?: string
          description?: string
          category?: 'food' | 'retail' | 'services' | 'healthcare' | 'education' | 'other'
          address?: string
          city?: string
          province?: string
          postal_code?: string
          latitude?: number
          longitude?: number
          phone?: string | null
          email?: string | null
          website?: string | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      opportunities: {
        Row: {
          id: string
          business_id: string
          title: string
          description: string
          requirements: string | null
          hours_available: number
          start_date: string | null
          end_date: string | null
          is_flexible: boolean
          perks: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          business_id: string
          title: string
          description: string
          requirements?: string | null
          hours_available: number
          start_date?: string | null
          end_date?: string | null
          is_flexible?: boolean
          perks?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          business_id?: string
          title?: string
          description?: string
          requirements?: string | null
          hours_available?: number
          start_date?: string | null
          end_date?: string | null
          is_flexible?: boolean
          perks?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      applications: {
        Row: {
          id: string
          profile_id: string
          opportunity_id: string
          status: 'pending' | 'accepted' | 'rejected' | 'completed'
          message: string | null
          hours_completed: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          opportunity_id: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          message?: string | null
          hours_completed?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          opportunity_id?: string
          status?: 'pending' | 'accepted' | 'rejected' | 'completed'
          message?: string | null
          hours_completed?: number
          created_at?: string
          updated_at?: string
        }
      }
      bookmarks: {
        Row: {
          id: string
          profile_id: string
          opportunity_id: string
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          opportunity_id: string
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          opportunity_id?: string
          created_at?: string
        }
      }
      ratings: {
        Row: {
          id: string
          profile_id: string
          business_id: string
          rating: number
          review: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          business_id: string
          rating: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          business_id?: string
          rating?: number
          review?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
