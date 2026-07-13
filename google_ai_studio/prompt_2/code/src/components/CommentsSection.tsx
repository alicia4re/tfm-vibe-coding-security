/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { Comment, UserProfile } from '../types';
import { 
  MessageSquare, Trash2, Send, Bold, Italic, CheckCircle, AlertCircle, 
  User, Loader, Info 
} from 'lucide-react';

interface CommentsSectionProps {
  articleId: string;
  userProfile: UserProfile | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  articleId,
  userProfile,
  onOpenAuth,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchComments = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'comments'),
        where('articleId', '==', articleId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const list: Comment[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() } as Comment);
      });
      setComments(list);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const insertFormatting = (before: string, after: string = '') => {
    const input = document.getElementById('comment-textarea') as HTMLTextAreaElement;
    if (!input) return;

    const start = input.selectionStart;
    const end = input.selectionEnd;
    const text = input.value;
    const selectedText = text.substring(start, end);
    const replacement = before + (selectedText || 'texto') + after;

    setCommentInput(text.substring(0, start) + replacement + text.substring(end));
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + before.length, start + before.length + (selectedText || 'texto').length);
    }, 50);
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth('login');
      return;
    }

    const cleanContent = commentInput.trim();
    if (!cleanContent) return;

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const newCommentData = {
        articleId,
        authorId: userProfile.uid,
        authorName: userProfile.email.split('@')[0],
        authorEmail: userProfile.email,
        content: cleanContent,
        createdAt: Timestamp.now(),
      };

      const docRef = await addDoc(collection(db, 'comments'), newCommentData);
      
      const newComment: Comment = {
        id: docRef.id,
        ...newCommentData,
        createdAt: { toDate: () => new Date() } // temporary mock timestamp for local update
      };

      setComments([newComment, ...comments]);
      setCommentInput('');
      setSuccessMsg('¡Comentario publicado!');
      setTimeout(() => setSuccessMsg(''), 2500);
    } catch (err: any) {
      console.error('Error saving comment:', err);
      setErrorMsg('No se pudo publicar el comentario.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      setComments(comments.filter(c => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      alert('Error al intentar eliminar el comentario.');
    }
  };

  // Basic formatter helper for comment displays
  const formatCommentContent = (text: string): string => {
    if (!text) return '';
    let formatted = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic: *text*
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Headings: ### text
    formatted = formatted.replace(/^### (.*?)$/gm, '<h4 class="font-bold text-sm my-1">$1</h4>');

    return formatted.replace(/\n/g, '<br />');
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-150">
      <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
        <MessageSquare className="w-5 h-5 text-indigo-600" />
        Comentarios ({comments.length})
      </h3>

      {/* Post Comment Section */}
      {userProfile ? (
        <form onSubmit={handlePostComment} className="mb-8 space-y-3">
          <div className="bg-white border border-gray-150 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
            {/* Formatting Toolbar */}
            <div className="flex gap-2 p-2 border-b border-gray-100 bg-gray-50 text-gray-400">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**')}
                title="Negrita"
                className="p-1 hover:text-gray-700 hover:bg-white rounded transition-colors text-xs font-semibold flex items-center gap-0.5"
              >
                <Bold className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*')}
                title="Cursiva"
                className="p-1 hover:text-gray-700 hover:bg-white rounded transition-colors text-xs font-semibold flex items-center gap-0.5"
              >
                <Italic className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('### ')}
                title="Título pequeño"
                className="px-1.5 py-0.5 hover:text-gray-700 hover:bg-white rounded transition-colors text-[10px] font-extrabold"
              >
                H3
              </button>
            </div>

            <textarea
              id="comment-textarea"
              rows={3}
              required
              value={commentInput}
              onChange={(e) => setCommentInput(e.target.value)}
              placeholder="Escribe un comentario... Admite formato básico (**, *, ###)."
              className="w-full p-4 border-none focus:outline-none focus:ring-0 text-sm text-gray-700 resize-none bg-transparent"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-500 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              {errorMsg}
            </p>
          )}

          {successMsg && (
            <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              {successMsg}
            </p>
          )}

          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-400 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Puedes usar Markdown básico
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all disabled:opacity-50"
            >
              {submitting ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Comentar
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-5 bg-gray-50 border border-gray-150 rounded-2xl text-center mb-8">
          <p className="text-sm text-gray-500 mb-3">Debes iniciar sesión para poder comentar en este artículo.</p>
          <button
            onClick={() => onOpenAuth('login')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
          >
            Iniciar Sesión
          </button>
        </div>
      )}

      {/* Comments List */}
      {loading ? (
        <div className="py-8 text-center text-gray-400 text-sm flex items-center justify-center gap-2">
          <Loader className="w-4 h-4 animate-spin text-indigo-600" />
          Cargando comentarios...
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic text-center py-6">Nadie ha comentado todavía. ¡Sé el primero en dejar tu opinión!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => {
            const date = comment.createdAt?.toDate 
              ? comment.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
              : 'Reciente';

            // Check if current user is editor, or is the author of this specific comment
            const canDelete = userProfile && (
              userProfile.role === 'editor' || 
              userProfile.uid === comment.authorId
            );

            return (
              <div 
                key={comment.id}
                className="p-4 bg-white border border-gray-150 rounded-2xl flex gap-3 hover:border-gray-200 transition-colors relative group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 font-bold text-xs shrink-0 border border-gray-200">
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-sm text-gray-900">{comment.authorName}</span>
                    <span className="text-[10px] text-gray-400">{date}</span>
                  </div>
                  <div 
                    className="mt-1.5 text-sm text-gray-700 leading-relaxed break-words prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: formatCommentContent(comment.content) }}
                  />
                </div>

                {canDelete && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    title="Eliminar comentario"
                    className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
