import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type UserRole = 'reader' | 'author' | 'editor';

export type ArticleStatus = 'draft' | 'review' | 'published';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  bio: string;
  role: UserRole;
  api_token: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author_id: string;
  status: ArticleStatus;
  tags: string[];
  cover_image_url: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'display_name' | 'email'>;
}

export interface Comment {
  id: string;
  article_id: string;
  author_id: string;
  body: string;
  created_at: string;
  updated_at: string;
  author?: Pick<Profile, 'id' | 'display_name' | 'email'>;
}

export type ArticleWithAuthor = Article & { author: Pick<Profile, 'id' | 'display_name' | 'email'> };
export type CommentWithAuthor = Comment & { author: Pick<Profile, 'id' | 'display_name' | 'email'> };
