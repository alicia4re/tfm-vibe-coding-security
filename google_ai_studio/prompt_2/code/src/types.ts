/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'lector' | 'autor' | 'editor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  apiToken: string;
  createdAt: any; // Timestamp or ISO string
}

export type ArticleStatus = 'borrador' | 'revision' | 'publicado';

export interface LinkPreview {
  url: string;
  title: string;
  image: string;
}

export interface Article {
  id: string;
  title: string;
  content: string; // HTML or Markdown format
  authorId: string;
  authorName: string;
  authorEmail: string;
  status: ArticleStatus;
  createdAt: any; // Timestamp or date
  updatedAt: any;
  tags: string[];
  linkPreviews?: LinkPreview[];
}

export interface Comment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  content: string;
  createdAt: any; // Timestamp or date
}
