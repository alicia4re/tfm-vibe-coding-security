/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Article, ArticleStatus, LinkPreview, UserProfile } from '../types';
import { 
  ArrowLeft, Save, FileText, Send, Eye, Edit3, Image, Link, Bold, Italic, 
  Heading1, Heading2, Quote, Plus, X, Globe, AlertCircle, Loader, HelpCircle 
} from 'lucide-react';

interface ArticleEditorProps {
  userProfile: UserProfile;
  editingArticle: Article | null;
  onBack: () => void;
  onSaveSuccess: () => void;
}

export const ArticleEditor: React.FC<ArticleEditorProps> = ({
  userProfile,
  editingArticle,
  onBack,
  onSaveSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<ArticleStatus>('borrador');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Link preview variables
  const [linkInput, setLinkInput] = useState('');
  const [linkPreviews, setLinkPreviews] = useState<LinkPreview[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState('');

  // Editor vs Preview Tabs
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load article if editing
  useEffect(() => {
    if (editingArticle) {
      setTitle(editingArticle.title);
      setContent(editingArticle.content);
      setStatus(editingArticle.status);
      setTags(editingArticle.tags || []);
      setLinkPreviews(editingArticle.linkPreviews || []);
    } else {
      // Default state for new article
      setTitle('');
      setContent('');
      setStatus('borrador');
      setTags([]);
      setLinkPreviews([]);
    }
  }, [editingArticle]);

  // Insert formatting markdown helper
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = before + (selectedText || 'texto') + after;

    setContent(text.substring(0, start) + replacement + text.substring(end));
    
    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + (selectedText || 'texto').length);
    }, 50);
  };

  // Tags management
  const handleAddTag = (e: React.FormEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const cleanTag = tagInput.trim().toLowerCase().replace(/#/g, '');
    if (cleanTag && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (indexToRemove: number) => {
    setTags(tags.filter((_, i) => i !== indexToRemove));
  };

  // Automated link preview scraping
  const handleFetchLinkPreview = async (e: React.FormEvent) => {
    e.preventDefault();
    let url = linkInput.trim();
    if (!url) return;

    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }

    setLoadingPreview(true);
    setPreviewError('');

    try {
      const response = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
      if (!response.ok) {
        throw new Error('No se pudo obtener la previsualización de este enlace.');
      }
      const data: LinkPreview = await response.json();
      
      // Check if already exists
      if (linkPreviews.some(item => item.url === data.url)) {
        setPreviewError('Este enlace ya ha sido añadido.');
        return;
      }

      setLinkPreviews([...linkPreviews, data]);
      setLinkInput('');
    } catch (err: any) {
      console.error(err);
      setPreviewError('Error al contactar con el servidor o URL no válida. Inténtalo de nuevo.');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleRemovePreview = (urlToRemove: string) => {
    setLinkPreviews(linkPreviews.filter(p => p.url !== urlToRemove));
  };

  // Submit/Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título es requerido.');
      return;
    }
    if (!content.trim()) {
      setErrorMsg('El contenido del artículo no puede estar vacío.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    try {
      const articleData = {
        title: title.trim(),
        content: content.trim(),
        status,
        tags,
        linkPreviews,
        updatedAt: Timestamp.now(),
      };

      if (editingArticle) {
        // Update
        const articleRef = doc(db, 'articles', editingArticle.id);
        await updateDoc(articleRef, articleData);
      } else {
        // Create
        const newArticle = {
          ...articleData,
          authorId: userProfile.uid,
          authorName: userProfile.email.split('@')[0], // friendly author name
          authorEmail: userProfile.email,
          createdAt: Timestamp.now(),
        };
        await addDoc(collection(db, 'articles'), newArticle);
      }

      onSaveSuccess();
    } catch (err: any) {
      console.error('Error saving article:', err);
      setErrorMsg('Error al guardar el artículo. Comprueba tus permisos.');
    } finally {
      setSaving(false);
    }
  };

  // Parse markdown client side for live preview
  const parseMarkdown = (md: string): string => {
    if (!md) return '<p class="text-gray-400 italic">Comienza a escribir tu contenido para ver una vista previa aquí...</p>';
    
    let html = md;
    
    // HTML Escape to be safe
    html = html
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
      
    // Headings
    html = html.replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-gray-900">$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-5 mb-3 text-gray-900">$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-gray-900">$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-gray-950">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em class="italic text-gray-800">$1</em>');
    
    // Blockquote
    html = html.replace(/^> (.*?)$/gm, '<blockquote class="border-l-4 border-indigo-500 pl-4 my-3 italic text-gray-600 bg-gray-50 py-1 rounded-r-lg">$1</blockquote>');
    
    // Images: ![alt](url)
    html = html.replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-4"><img src="$2" alt="$1" class="max-w-full h-auto rounded-xl border border-gray-100 shadow-sm mx-auto" /><p class="text-xs text-center text-gray-400 mt-1.5 italic">$1</p></div>');
    
    // Links: [text](url)
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-600 hover:underline hover:text-indigo-800 font-semibold inline-flex items-center gap-0.5">$1 ↗</a>');
    
    // Process double and single returns for lists and paragraphs
    const paragraphs = html.split(/\n{2,}/);
    return paragraphs.map(p => {
      if (/^\s*<(h\d|blockquote|div|p)/i.test(p)) {
        return p;
      }
      return `<p class="my-3 leading-relaxed text-gray-700">${p.replace(/\n/g, '<br />')}</p>`;
    }).join('\n');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 animate-fade-in">
      {/* Top Bar with back action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-gray-500 hover:text-indigo-600 bg-white border border-gray-100 hover:bg-indigo-50 rounded-xl transition-all shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
              {editingArticle ? 'Editar Artículo' : 'Crear Nuevo Artículo'}
            </h1>
            <p className="text-sm text-gray-500">
              {editingArticle ? 'Modifica tu borrador o responde a los comentarios del editor.' : 'Redacta un nuevo artículo para la comunidad.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Status selector with custom roles checks */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-sm w-full sm:w-auto">
            <span className="text-xs text-gray-400 font-semibold uppercase">Estado:</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ArticleStatus)}
              className="font-semibold text-gray-700 focus:outline-none bg-transparent cursor-pointer text-xs"
            >
              <option value="borrador">Borrador</option>
              <option value="revision">Enviar a Revisión</option>
              {/* Only Editors can publish articles */}
              {userProfile.role === 'editor' && (
                <option value="publicado">Publicado</option>
              )}
            </select>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl transition-all shadow-sm shadow-indigo-100 disabled:opacity-50 shrink-0 w-full sm:w-auto"
          >
            {saving ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : status === 'publicado' ? (
              <>
                <Globe className="w-4 h-4" />
                Publicar
              </>
            ) : status === 'revision' ? (
              <>
                <Send className="w-4 h-4" />
                Enviar
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Editor Main Warning */}
      {userProfile.role === 'autor' && status === 'borrador' && (
        <div className="p-3 mb-6 bg-indigo-50 border border-indigo-150 rounded-xl text-xs text-indigo-700 flex gap-2 items-center">
          <AlertCircle className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>
            <strong>Información para el Autor:</strong> Para hacer que este artículo sea visible para los editores y pueda ser publicado en el blog, cámbiale el estado a <strong>&quot;Enviar a Revisión&quot;</strong> antes de guardar.
          </span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 mb-6 bg-red-50 text-red-700 border border-red-100 rounded-xl text-sm font-medium">
          {errorMsg}
        </div>
      )}

      {/* Layout Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor Area (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title Field */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Título del Artículo
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Descubriendo el futuro de la Inteligencia Artificial"
              className="w-full text-lg sm:text-xl font-extrabold text-gray-900 border-none bg-transparent placeholder-gray-300 focus:outline-none focus:ring-0 p-0"
            />
          </div>

          {/* Content Field (Write vs Preview Tabs) */}
          <div className="bg-white border border-gray-150 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
            {/* Tab selection */}
            <div className="flex border-b border-gray-100 bg-gray-50 p-2 justify-between items-center">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'write'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Redactar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    activeTab === 'preview'
                      ? 'bg-white text-gray-800 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Previsualizar
                </button>
              </div>

              {/* Formatting helper icons */}
              {activeTab === 'write' && (
                <div className="flex items-center gap-0.5 sm:gap-1 text-gray-400 border-l border-gray-200 pl-2">
                  <button
                    type="button"
                    onClick={() => insertMarkdown('**', '**')}
                    title="Negrita"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all"
                  >
                    <Bold className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('*', '*')}
                    title="Cursiva"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all"
                  >
                    <Italic className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('## ')}
                    title="Título H2"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all font-bold text-[11px]"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('### ')}
                    title="Título H3"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all font-bold text-[11px]"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown('> ')}
                    title="Cita bloque"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all"
                  >
                    <Quote className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Introduce la URL de la imagen:');
                      if (url) insertMarkdown(`![descripción de la imagen](${url})`);
                    }}
                    title="Insertar imagen desde URL"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all"
                  >
                    <Image className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Introduce la URL del enlace:');
                      if (url) insertMarkdown('[título del enlace]', `(${url})`);
                    }}
                    title="Insertar enlace"
                    className="p-1.5 hover:text-gray-700 hover:bg-white rounded-md transition-all"
                  >
                    <Link className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Input / Render Area */}
            <div className="flex-1 flex flex-col p-6 min-h-[350px]">
              {activeTab === 'write' ? (
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Redacta el artículo en formato Markdown. Puedes utilizar el menú superior para aplicar estilos rápidamente o insertar enlaces e imágenes por URL."
                  className="w-full flex-1 border-none bg-transparent placeholder-gray-300 focus:outline-none focus:ring-0 text-sm leading-relaxed text-gray-700 resize-none h-full min-h-[300px]"
                />
              ) : (
                <div 
                  className="prose prose-sm max-w-none flex-1 overflow-y-auto"
                  dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Configuration (1 column) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Tag Manager Box */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-1">Etiquetas</h3>
            <p className="text-xs text-gray-400 mb-4">Añade palabras clave para que los lectores puedan clasificar y buscar tus artículos.</p>

            <form onSubmit={handleAddTag} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="Ej. tecnologia"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddTag(e); }}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg border border-indigo-100 transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5">
              {tags.length === 0 ? (
                <span className="text-xs text-gray-300 italic">No hay etiquetas añadidas.</span>
              ) : (
                tags.map((tag, index) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium text-xs border border-gray-200/50"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTag(index)}
                      className="text-gray-400 hover:text-red-500 rounded-full transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Link Scraper Box */}
          <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-gray-900 text-sm mb-1 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              Enlaces Externos Recomendados
            </h3>
            <p className="text-xs text-gray-400 mb-4">
              Pega un enlace externo. La plataforma extraerá automáticamente su título e imagen para mostrarlos como previsualización.
            </p>

            <form onSubmit={handleFetchLinkPreview} className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="https://ejemplo.com/pagina"
                value={linkInput}
                onChange={(e) => setLinkInput(e.target.value)}
                className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={loadingPreview}
                className="px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-all disabled:opacity-50 shrink-0 text-xs"
              >
                {loadingPreview ? (
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  'Obtener'
                )}
              </button>
            </form>

            {previewError && (
              <p className="text-[11px] text-red-500 font-medium mb-3 flex items-start gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {previewError}
              </p>
            )}

            {/* List of Link Previews Scraped */}
            <div className="space-y-3 mt-4">
              {linkPreviews.length === 0 ? (
                <span className="text-xs text-gray-300 italic block">No se han añadido enlaces externos.</span>
              ) : (
                linkPreviews.map((preview) => (
                  <div 
                    key={preview.url} 
                    className="relative group bg-gray-50 border border-gray-150 rounded-xl overflow-hidden flex gap-3 p-2.5 hover:border-gray-300 transition-colors"
                  >
                    {preview.image && (
                      <img 
                        src={preview.image} 
                        alt="" 
                        className="w-12 h-12 object-cover rounded-lg bg-gray-250 border border-gray-100 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className="text-xs font-bold text-gray-800 line-clamp-1" title={preview.title}>{preview.title}</h4>
                      <p className="text-[10px] text-gray-400 font-mono truncate mt-0.5" title={preview.url}>{preview.url}</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => handleRemovePreview(preview.url)}
                      className="absolute top-2 right-2 p-1 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full border border-gray-100 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
