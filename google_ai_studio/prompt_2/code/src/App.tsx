/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { Article, ArticleStatus, UserProfile } from './types';
import { Header } from './components/Header';
import { AuthModal } from './components/AuthModal';
import { ArticleEditor } from './components/ArticleEditor';
import { ArticleView } from './components/ArticleView';
import { UserManagement } from './components/UserManagement';
import { ApiTokenSettings } from './components/ApiTokenSettings';
import { 
  BookOpen, Search, Filter, Calendar, User, Eye, ArrowRight, ShieldAlert, 
  Trash2, Plus, Edit3, Sparkles, CheckCircle, AlertCircle, Loader, RefreshCw 
} from 'lucide-react';

export default function App() {
  // Session States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Core Data States
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering/Searching States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<ArticleStatus | 'todos'>('todos');

  // Navigation / Modal States
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isApiSettingsOpen, setIsApiSettingsOpen] = useState(false);
  
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  // 1. Authentication Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch Firestore Profile
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile({ uid: user.uid, ...docSnap.data() } as UserProfile);
          } else {
            console.warn('No Firestore user profile found for UID:', user.uid);
            setUserProfile(null);
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch Articles with secure role-based queries
  const fetchArticles = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const articlesRef = collection(db, 'articles');
      let fetchedList: Article[] = [];

      // Case A: Unauthenticated or Reader
      if (!userProfile || userProfile.role === 'lector') {
        const q = query(
          articlesRef, 
          where('status', '==', 'publicado'),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          fetchedList.push({ id: doc.id, ...doc.data() } as Article);
        });
      } 
      // Case B: Author - see all published + their own drafts/reviews
      else if (userProfile.role === 'autor') {
        // Query 1: Published articles
        const qPub = query(
          articlesRef,
          where('status', '==', 'publicado'),
          orderBy('createdAt', 'desc')
        );
        const snapPub = await getDocs(qPub);
        
        // Query 2: Author's own articles
        const qOwn = query(
          articlesRef,
          where('authorId', '==', userProfile.uid),
          orderBy('createdAt', 'desc')
        );
        const snapOwn = await getDocs(qOwn);

        const map = new Map<string, Article>();
        snapPub.forEach(doc => {
          map.set(doc.id, { id: doc.id, ...doc.data() } as Article);
        });
        snapOwn.forEach(doc => {
          map.set(doc.id, { id: doc.id, ...doc.data() } as Article);
        });

        // Convert Map to array and sort by createdAt descending
        fetchedList = Array.from(map.values()).sort((a, b) => {
          const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : 0;
          const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : 0;
          return dateB - dateA;
        });
      } 
      // Case C: Editor - can see everything!
      else if (userProfile.role === 'editor') {
        const qAll = query(articlesRef, orderBy('createdAt', 'desc'));
        const snapAll = await getDocs(qAll);
        snapAll.forEach((doc) => {
          fetchedList.push({ id: doc.id, ...doc.data() } as Article);
        });
      }

      setArticles(fetchedList);
    } catch (err: any) {
      console.error('Error fetching articles:', err);
      setErrorMsg('No se pudieron cargar los artículos de la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch articles when user profile changes
  useEffect(() => {
    fetchArticles();
  }, [userProfile]);

  // Handle Log Out
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
      // Close any active user screen
      setIsEditing(false);
      setIsUserManagementOpen(false);
      setIsApiSettingsOpen(false);
      setSelectedArticle(null);
      
      setSuccessMsg('Sesión cerrada correctamente.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (e) {
      console.error('Error logging out:', e);
    }
  };

  // Handle deleting an article
  const handleDeleteArticle = async (e: React.MouseEvent, articleId: string) => {
    e.stopPropagation(); // prevent clicking card to view
    if (!window.confirm('¿Estás seguro de que deseas eliminar este artículo de forma permanente?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'articles', articleId));
      setArticles(articles.filter(a => a.id !== articleId));
      setSuccessMsg('Artículo eliminado correctamente.');
      setTimeout(() => setSuccessMsg(''), 3000);

      if (selectedArticle && selectedArticle.id === articleId) {
        setSelectedArticle(null);
      }
    } catch (e) {
      console.error(e);
      setErrorMsg('No tienes los permisos necesarios para borrar este artículo.');
    }
  };

  // Extract all unique tags for horizontal filters
  const allTags = Array.from(
    new Set(articles.flatMap(a => a.tags || []))
  );

  // Helper to strip markdown formatting for card excerpts
  const getCleanExcerpt = (content: string, length = 140) => {
    if (!content) return '';
    let clean = content
      .replace(/[#*`>!\[\]()]/g, '') // remove markdown symbols
      .replace(/\n+/g, ' ') // replace newlines with space
      .trim();
    if (clean.length > length) {
      return clean.substring(0, length) + '...';
    }
    return clean;
  };

  // Filter Articles based on Search & Status/Tag selections
  const filteredArticles = articles.filter(article => {
    const matchSearch = searchQuery.trim() === '' || 
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (article.tags && article.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchTag = !selectedTagFilter || (article.tags && article.tags.includes(selectedTagFilter));

    const matchStatus = selectedStatusFilter === 'todos' || article.status === selectedStatusFilter;

    return matchSearch && matchTag && matchStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-800">
      {/* Top Header Component */}
      <Header
        userProfile={userProfile}
        onOpenAuth={(mode) => {
          setAuthModalMode(mode);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        onOpenEditor={() => {
          setEditingArticle(null);
          setIsEditing(true);
          setSelectedArticle(null);
          setIsUserManagementOpen(false);
          setIsApiSettingsOpen(false);
        }}
        onOpenUserManagement={() => {
          setIsUserManagementOpen(true);
          setIsEditing(false);
          setSelectedArticle(null);
          setIsApiSettingsOpen(false);
        }}
        onOpenApiSettings={() => {
          setIsApiSettingsOpen(true);
          setIsEditing(false);
          setSelectedArticle(null);
          setIsUserManagementOpen(false);
        }}
        onHome={() => {
          setSelectedArticle(null);
          setIsEditing(false);
          setIsUserManagementOpen(false);
          setIsApiSettingsOpen(false);
          setSelectedTagFilter(null);
          setSelectedStatusFilter('todos');
        }}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Main View Wrapper */}
      <main className="flex-1 pb-16">
        {/* User Management Screen */}
        {isUserManagementOpen && userProfile && userProfile.role === 'editor' && (
          <UserManagement
            currentUserProfile={userProfile}
            onBack={() => setIsUserManagementOpen(false)}
          />
        )}

        {/* API Token Configuration Screen */}
        {isApiSettingsOpen && userProfile && (
          <ApiTokenSettings
            userProfile={userProfile}
            onUpdateProfile={(updated) => setUserProfile(updated)}
            onBack={() => setIsApiSettingsOpen(false)}
          />
        )}

        {/* Article Editor Screen */}
        {isEditing && userProfile && (userProfile.role === 'autor' || userProfile.role === 'editor') && (
          <ArticleEditor
            userProfile={userProfile}
            editingArticle={editingArticle}
            onBack={() => {
              setIsEditing(false);
              setEditingArticle(null);
            }}
            onSaveSuccess={() => {
              setIsEditing(false);
              setEditingArticle(null);
              fetchArticles();
              setSuccessMsg('¡Artículo guardado con éxito!');
              setTimeout(() => setSuccessMsg(''), 4000);
            }}
          />
        )}

        {/* Single Article Detailed View */}
        {selectedArticle && !isEditing && !isUserManagementOpen && !isApiSettingsOpen && (
          <ArticleView
            article={selectedArticle}
            userProfile={userProfile}
            onBack={() => setSelectedArticle(null)}
            onEdit={(article) => {
              setEditingArticle(article);
              setIsEditing(true);
            }}
            onOpenAuth={(mode) => {
              setAuthModalMode(mode);
              setAuthModalOpen(true);
            }}
            onStatusChangeSuccess={() => {
              fetchArticles();
              setSelectedArticle(null);
            }}
          />
        )}

        {/* Main Feed / Grid List (shown if no detailed screen is active) */}
        {!isEditing && !selectedArticle && !isUserManagementOpen && !isApiSettingsOpen && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
            {/* Messages */}
            {successMsg && (
              <div className="flex items-center gap-2 p-4 mb-6 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 text-sm font-medium">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-4 mb-6 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Hero / Introduction Board */}
            <div className="relative rounded-3xl bg-slate-900 overflow-hidden mb-12 py-10 px-6 sm:py-14 sm:px-12 text-white border border-slate-800 shadow-xl shadow-slate-100">
              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/15 text-indigo-300 font-bold text-[10px] uppercase tracking-wider rounded-full mb-4 border border-indigo-500/20">
                  <Sparkles className="w-3 h-3" />
                  Mesa Redonda Co-op
                </span>
                <h1 className="text-3xl sm:text-4.5xl font-extrabold tracking-tight leading-none mb-3">
                  Voces libres, ideas compartidas.
                </h1>
                <p className="text-sm sm:text-base text-slate-350 leading-relaxed mb-6">
                  Una plataforma colaborativa de libre expresión. Explora artículos de opinión, análisis y debates redactados por nuestra mesa de expertos o únete para aportar tus ideas.
                </p>

                {/* Quick Interactive Call-to-actions */}
                <div className="flex flex-wrap gap-3">
                  {!userProfile ? (
                    <button
                      onClick={() => {
                        setAuthModalMode('register');
                        setAuthModalOpen(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                    >
                      Empezar a escribir
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    (userProfile.role === 'autor' || userProfile.role === 'editor') && (
                      <button
                        onClick={() => {
                          setEditingArticle(null);
                          setIsEditing(true);
                        }}
                        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all flex items-center gap-1.5"
                      >
                        Crear nuevo artículo
                        <Plus className="w-4 h-4" />
                      </button>
                    )
                  )}
                  <button
                    onClick={() => {
                      const el = document.getElementById('feed-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-xl transition-all"
                  >
                    Explorar artículos
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Filter and Tags Section */}
            <div id="feed-section" className="mb-8">
              {/* Filter controls row */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-gray-150 mb-6">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">Últimos Artículos</h2>
                  <p className="text-xs text-gray-500">Filtrados según tus preferencias y permisos de usuario</p>
                </div>

                {/* Author/Editor filter indicators */}
                {userProfile && (userProfile.role === 'autor' || userProfile.role === 'editor') && (
                  <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-1.5 shadow-sm text-xs">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Ver Estado:</span>
                    <select
                      value={selectedStatusFilter}
                      onChange={(e) => setSelectedStatusFilter(e.target.value as ArticleStatus | 'todos')}
                      className="font-bold text-gray-700 focus:outline-none bg-transparent cursor-pointer text-xs"
                    >
                      <option value="todos">Todos los permitidos</option>
                      <option value="publicado">Publicados</option>
                      <option value="borrador">Mis Borradores</option>
                      <option value="revision">En Revisión</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Horizontal Scroll Tags bar */}
              {allTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
                  <button
                    onClick={() => setSelectedTagFilter(null)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border shrink-0 transition-all ${
                      !selectedTagFilter
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    Todo
                  </button>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setSelectedTagFilter(tag)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border shrink-0 transition-all ${
                        selectedTagFilter === tag
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Articles List Content */}
            {loading ? (
              <div className="py-24 text-center text-gray-400">
                <Loader className="w-8 h-8 animate-spin mx-auto text-indigo-600 mb-3" />
                <span className="text-sm font-semibold">Cargando la mesa de redacción...</span>
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="py-24 text-center bg-white border border-gray-150 rounded-3xl p-8 max-w-xl mx-auto">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-base font-bold text-gray-800">No se encontraron artículos</h3>
                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                  No hay artículos publicados que coincidan con tus filtros de búsqueda. {userProfile ? '¡Sé el primero en crear uno nuevo!' : 'Inicia sesión para crear una cuenta.'}
                </p>
                {userProfile && (userProfile.role === 'autor' || userProfile.role === 'editor') && (
                  <button
                    onClick={() => {
                      setEditingArticle(null);
                      setIsEditing(true);
                    }}
                    className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
                  >
                    Crear nuevo artículo
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredArticles.map((article) => {
                  const date = article.createdAt?.toDate 
                    ? article.createdAt.toDate().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Reciente';

                  // Determine clean thumbnail URL
                  let thumbnail = 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=60';
                  if (article.linkPreviews && article.linkPreviews.length > 0 && article.linkPreviews[0].image) {
                    thumbnail = article.linkPreviews[0].image;
                  } else {
                    // Try to scrape first image from markdown inline
                    const imgRegex = /!\[.*?\]\((.*?)\)/;
                    const match = article.content.match(imgRegex);
                    if (match && match[1]) {
                      thumbnail = match[1];
                    }
                  }

                  const isOwner = userProfile && userProfile.uid === article.authorId;
                  const isEditorUser = userProfile && userProfile.role === 'editor';
                  const showDelete = isOwner || isEditorUser;

                  return (
                    <div
                      key={article.id}
                      onClick={() => setSelectedArticle(article)}
                      className="group bg-white border border-gray-150/80 rounded-2xl overflow-hidden hover:border-indigo-350 hover:shadow-xl hover:shadow-indigo-50/10 transition-all duration-300 cursor-pointer flex flex-col h-full relative"
                    >
                      {/* Image Cover */}
                      <div className="relative h-44 w-full bg-gray-100 overflow-hidden border-b border-gray-100">
                        <img
                          src={thumbnail}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        
                        {/* Status absolute label if not published */}
                        {article.status !== 'publicado' && (
                          <div className="absolute top-3 left-3">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border shadow-sm ${
                              article.status === 'revision' 
                                ? 'bg-purple-600 text-white border-purple-500' 
                                : 'bg-indigo-600 text-white border-indigo-500'
                            }`}>
                              {article.status}
                            </span>
                          </div>
                        )}

                        {/* Action buttons on card hover */}
                        {showDelete && (
                          <button
                            onClick={(e) => handleDeleteArticle(e, article.id)}
                            className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-red-55 hover:text-white text-gray-500 hover:border-red-500 border border-gray-200/55 rounded-xl transition-all shadow-sm"
                            title="Eliminar artículo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Card Content */}
                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Title */}
                          <h3 className="font-bold text-gray-900 group-hover:text-indigo-600 text-base line-clamp-2 leading-snug tracking-tight mb-2 transition-colors">
                            {article.title}
                          </h3>

                          {/* Excerpt */}
                          <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mb-4">
                            {getCleanExcerpt(article.content)}
                          </p>
                        </div>

                        <div>
                          {/* Tags block on card */}
                          {article.tags && article.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-4">
                              {article.tags.slice(0, 3).map(tag => (
                                <span 
                                  key={tag} 
                                  className="text-[10px] bg-gray-50 border border-gray-100 text-gray-400 font-semibold px-2 py-0.5 rounded"
                                >
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Footer row */}
                          <div className="flex items-center justify-between border-t border-gray-50 pt-3.5 text-[11px] text-gray-450">
                            <span className="flex items-center gap-1 font-medium text-gray-600">
                              <User className="w-3 h-3 text-indigo-500" />
                              {article.authorName}
                            </span>
                            <span className="flex items-center gap-1 font-mono text-[10px]">
                              <Calendar className="w-3.5 h-3.5 text-gray-400" />
                              {date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding info */}
      <footer className="bg-white border-t border-gray-100 py-6 text-center text-xs text-gray-400 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold text-gray-700">
            <BookOpen className="w-4 h-4 text-indigo-600" />
            <span>Mesa Redonda</span>
          </div>
          <p>© 2026 Mesa Redonda. Diseñado con precisión y respeto por la libre difusión de ideas.</p>
        </div>
      </footer>

      {/* Auth Modal overlay wrapper */}
      <AuthModal
        isOpen={authModalOpen}
        initialMode={authModalMode}
        onClose={() => setAuthModalOpen(false)}
        onAuthSuccess={(profile) => {
          setUserProfile(profile);
          fetchArticles();
        }}
      />
    </div>
  );
}
