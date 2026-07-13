/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { db } from '../firebase';
import { updateDoc, doc } from 'firebase/firestore';
import { Article, UserProfile } from '../types';
import { CommentsSection } from './CommentsSection';
import { 
  ArrowLeft, Edit3, Globe, EyeOff, Loader, Calendar, User, 
  ExternalLink, ChevronRight, CheckCircle, Clock 
} from 'lucide-react';

interface ArticleViewProps {
  article: Article;
  userProfile: UserProfile | null;
  onBack: () => void;
  onEdit: (article: Article) => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onStatusChangeSuccess: () => void;
}

export const ArticleView: React.FC<ArticleViewProps> = ({
  article,
  userProfile,
  onBack,
  onEdit,
  onOpenAuth,
  onStatusChangeSuccess,
}) => {
  const [updating, setUpdating] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Markdown client-side parser
  const parseMarkdown = (md: string): string => {
    if (!md) return '';
    let html = md;
    
    // HTML Escape to be safe
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Headings
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-6 mb-2 text-gray-900">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-7 mb-3 text-gray-900">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-8 mb-4 text-gray-900">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');
    
    // Blockquote
    html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 my-4 italic text-gray-600 bg-gray-50 py-1 rounded-r-lg">$1</blockquote>');
    
    // Images: ![alt](url)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-6"><img src="$2" alt="$1" class="max-w-full h-auto rounded-xl border border-gray-100 shadow-sm mx-auto" /><p class="text-xs text-center text-gray-400 mt-2 italic">$1</p></div>');
    
    // Links: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5">$1 ↗</a>');
    
    // Process double and single returns for paragraphs
    const paragraphs = html.split(/\n{2,}/);
    return paragraphs.map(p => {
      if (/^\s*<(h\d|blockquote|div|p)/i.test(p)) {
        return p;
      }
      return `<p class="my-4 leading-relaxed text-gray-700">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');
  };

  const handleEditorPublish = async (newStatus: 'publicado' | 'borrador') => {
    setUpdating(true);
    setSuccessMsg('');
    try {
      const articleRef = doc(db, 'articles', article.id);
      await updateDoc(articleRef, { status: newStatus });
      setSuccessMsg(newStatus === 'publicado' ? '¡Artículo publicado con éxito!' : 'Artículo despublicado y devuelto a borrador.');
      setTimeout(() => {
        setSuccessMsg('');
        onStatusChangeSuccess();
      }, 1500);
    } catch (e) {
      console.error(e);
      alert('Error de permisos al modificar el estado del artículo.');
    } finally {
      setUpdating(false);
    }
  };

  const formattedDate = article.createdAt?.toDate
    ? article.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recientemente';

  const isAuthor = userProfile && userProfile.uid === article.authorId;
  const isEditor = userProfile && userProfile.role === 'editor';
  const canEdit = isAuthor || isEditor;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 animate-fade-in">
      {/* Back & Actions header */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-indigo-600 bg-white border border-gray-150 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al blog
        </button>

        {canEdit && (
          <div className="flex items-center gap-2">
            {/* Editor Quick Moderation Controls */}
            {isEditor && (
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl p-1 shadow-inner">
                {article.status !== 'publicado' ? (
                  <button
                    onClick={() => handleEditorPublish('publicado')}
                    disabled={updating}
                    className="flex items-center gap-1 px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                  >
                    {updating ? <Loader className="w-3 h-3 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    Aprobar y Publicar
                  </button>
                ) : (
                  <button
                    onClick={() => handleEditorPublish('borrador')}
                    disabled={updating}
                    className="flex items-center gap-1 px-3 py-1 bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-semibold rounded-lg border border-gray-200 hover:border-red-100 transition-all disabled:opacity-50"
                  >
                    {updating ? <Loader className="w-3 h-3 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                    Despublicar
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => onEdit(article)}
              className="flex items-center gap-1 px-3.5 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-semibold text-xs rounded-xl transition-all shadow-sm shrink-0"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Editar artículo
            </button>
          </div>
        )}
      </div>

      {successMsg && (
        <div className="p-4 mb-6 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl text-sm font-medium flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Moderation Warning Header if Draft or Review */}
      {article.status !== 'publicado' && (
        <div className={`p-4 mb-8 rounded-2xl border flex gap-3 items-start ${
          article.status === 'revision' 
            ? 'bg-purple-50 border-purple-150 text-purple-800' 
            : 'bg-indigo-50 border-indigo-150 text-indigo-800'
        }`}>
          {article.status === 'revision' ? (
            <Clock className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
          ) : (
            <Clock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold text-sm block">
              {article.status === 'revision' ? 'Artículo en Revisión' : 'Artículo Guardado como Borrador'}
            </span>
            <span className="text-xs leading-relaxed opacity-90 block mt-0.5">
              {article.status === 'revision' 
                ? 'Este artículo está pendiente de que un Editor lo revise y lo apruebe para publicarlo. Solo tú y los editores pueden ver esta página.' 
                : 'Este artículo aún es privado. Puedes seguir editándolo y cuando esté listo, enviarlo a revisión. Solo tú y los editores pueden ver esta página.'}
            </span>
          </div>
        </div>
      )}

      {/* Article Container */}
      <article className="bg-white border border-gray-150 rounded-2xl p-6 sm:p-10 shadow-sm overflow-hidden">
        {/* Title */}
        <h1 className="text-2xl sm:text-3.5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-4">
          {article.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-y-2 gap-x-4 border-b border-gray-100 pb-6 mb-8 text-xs text-gray-500">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-[10px]">
              {article.authorName ? article.authorName[0].toUpperCase() : 'A'}
            </div>
            {article.authorName}
          </div>

          <span className="text-gray-300">•</span>

          <div className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDate}
          </div>

          {article.status !== 'publicado' && (
            <>
              <span className="text-gray-300">•</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${
                article.status === 'revision' 
                  ? 'bg-purple-50 text-purple-700 border-purple-150' 
                  : 'bg-indigo-50 text-indigo-700 border-indigo-150'
              }`}>
                {article.status}
              </span>
            </>
          )}

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {article.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-0.5 bg-gray-55 border border-gray-100 text-gray-500 rounded font-semibold text-[10px]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Article Markdown Body */}
        <div 
          className="prose prose-indigo max-w-none text-gray-800 leading-relaxed text-sm sm:text-base border-b border-gray-100 pb-10"
          dangerouslySetInnerHTML={{ __html: parseMarkdown(article.content) }}
        />

        {/* Link Previews Section (Automated link preview requirement) */}
        {article.linkPreviews && article.linkPreviews.length > 0 && (
          <div className="mt-8">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">Enlaces de Interés</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {article.linkPreviews.map((preview) => (
                <a
                  key={preview.url}
                  href={preview.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group bg-gray-50 hover:bg-indigo-50/30 border border-gray-150 hover:border-indigo-150 rounded-2xl overflow-hidden flex gap-4 p-3.5 transition-all duration-300"
                >
                  {preview.image && (
                    <img
                      src={preview.image}
                      alt=""
                      className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0 bg-gray-200 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <div className="flex-1 min-w-0 pr-2">
                    <h5 className="text-xs sm:text-sm font-bold text-gray-800 group-hover:text-indigo-700 line-clamp-2 leading-snug transition-colors">
                      {preview.title}
                    </h5>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-2 truncate">
                      <span className="truncate">{preview.url}</span>
                      <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Comments Container */}
      <CommentsSection
        articleId={article.id}
        userProfile={userProfile}
        onOpenAuth={onOpenAuth}
      />
    </div>
  );
};
