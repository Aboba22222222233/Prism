import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Plus, Trash2, X, Loader2, Image, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface BlogPost {
    id: string;
    title: string;
    content: string;
    cover_image_url: string | null;
    created_at: string;
}

const Blog = () => {
    const navigate = useNavigate();
    const [clickCount, setClickCount] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [coverImage, setCoverImage] = useState<File | null>(null);
    const [coverPreview, setCoverPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load posts and check auth
    useEffect(() => {
        fetchPosts();
        checkAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            checkAdminStatus(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        checkAdminStatus(session);
    };

    const checkAdminStatus = async (session: any) => {
        if (!session) {
            setIsAdmin(false);
            setAdminEmail('');
            return;
        }

        // Check if user is admin by querying blog_admins table
        const { data, error } = await supabase
            .from('blog_admins')
            .select('id')
            .eq('user_id', session.user.id)
            .single();

        if (data && !error) {
            setIsAdmin(true);
            setAdminEmail(session.user.email || '');
        } else {
            setIsAdmin(false);
        }
    };

    const fetchPosts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('blog_posts')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching posts:', error);
        } else {
            setPosts(data || []);
        }
        setLoading(false);
    };

    // Handle secret click on 2026
    const handleSecretClick = () => {
        if (isAdmin) return; // Already logged in
        const newCount = clickCount + 1;
        setClickCount(newCount);
        if (newCount >= 5) {
            setShowLoginModal(true);
            setClickCount(0);
        }
    };

    // Handle login
    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) return;

        setLoginLoading(true);
        setLoginError('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password
        });

        if (error) {
            setLoginError('Неверный email или пароль');
        } else {
            // Check if this user is in blog_admins
            const { data: adminData } = await supabase
                .from('blog_admins')
                .select('id')
                .eq('user_id', data.user?.id)
                .single();

            if (adminData) {
                setIsAdmin(true);
                setAdminEmail(data.user?.email || '');
                setShowLoginModal(false);
                setEmail('');
                setPassword('');
            } else {
                await supabase.auth.signOut();
                setLoginError('У вас нет прав администратора');
            }
        }
        setLoginLoading(false);
    };

    // Handle logout
    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsAdmin(false);
        setAdminEmail('');
    };

    // Handle file selection
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл слишком большой. Максимум 5MB.');
                return;
            }
            if (!file.type.startsWith('image/')) {
                alert('Можно загружать только изображения.');
                return;
            }
            setCoverImage(file);
            setCoverPreview(URL.createObjectURL(file));
        }
    };

    // Remove cover image
    const removeCoverImage = () => {
        setCoverImage(null);
        setCoverPreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Upload image to Supabase Storage
    const uploadImage = async (file: File): Promise<string | null> => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `blog-covers/${fileName}`;

        setUploadProgress(10);

        const { error } = await supabase.storage
            .from('blog-images')
            .upload(filePath, file);

        setUploadProgress(70);

        if (error) {
            console.error('Upload error:', error);
            return null;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('blog-images')
            .getPublicUrl(filePath);

        setUploadProgress(100);
        return publicUrl;
    };

    // Add new post
    const handleAddPost = async () => {
        if (!newTitle.trim() || !newContent.trim()) return;

        setSaving(true);
        setUploadProgress(0);

        let coverImageUrl: string | null = null;

        // Upload cover image if selected
        if (coverImage) {
            coverImageUrl = await uploadImage(coverImage);
            if (!coverImageUrl) {
                alert('Ошибка загрузки изображения');
                setSaving(false);
                return;
            }
        }

        const { error } = await supabase
            .from('blog_posts')
            .insert([
                {
                    title: newTitle,
                    content: newContent,
                    cover_image_url: coverImageUrl
                }
            ]);

        if (error) {
            console.error('Error adding post:', error);
            if (error.code === '42501') {
                alert('Нет прав на добавление поста');
            } else {
                alert('Ошибка при добавлении поста');
            }
        } else {
            await fetchPosts();
            setNewTitle('');
            setNewContent('');
            setCoverImage(null);
            setCoverPreview(null);
            setShowAddModal(false);
        }
        setSaving(false);
        setUploadProgress(0);
    };

    // Delete post
    const handleDeletePost = async (id: string) => {
        if (!confirm('Удалить пост?')) return;

        const { error } = await supabase
            .from('blog_posts')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting post:', error);
            if (error.code === '42501') {
                alert('Нет прав на удаление поста');
            } else {
                alert('Ошибка при удалении поста');
            }
        } else {
            await fetchPosts();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50 font-geist">
            {/* Header */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-4xl mx-auto px-8 py-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Blog</h1>
                            <p className="text-sm text-slate-500">Новости и обновления платформы Prism</p>
                        </div>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{adminEmail}</span>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                Новый пост
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-slate-500 hover:text-slate-700 text-sm transition-colors"
                            >
                                Выйти
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-8 py-12">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
                        <FileText className="w-16 h-16 text-slate-300 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold text-slate-900 mb-2">Скоро здесь появятся статьи</h2>
                        <p className="text-slate-500">Мы работаем над интересным контентом для вас</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                                {/* Cover Image */}
                                {post.cover_image_url && (
                                    <div className="w-full h-64 overflow-hidden">
                                        <img
                                            src={post.cover_image_url}
                                            alt={post.title}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                )}

                                <div className="p-8">
                                    {isAdmin && (
                                        <button
                                            onClick={() => handleDeletePost(post.id)}
                                            className="absolute top-4 right-4 p-2 bg-white/80 rounded-full text-slate-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    )}
                                    <p className="text-sm text-indigo-500 font-medium mb-2">{formatDate(post.created_at)}</p>
                                    <h2 className="text-2xl font-bold text-slate-900 mb-4">{post.title}</h2>
                                    <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-slate-200 py-8">
                <div className="max-w-4xl mx-auto px-8 text-center text-slate-400 text-sm">
                    © <span onClick={handleSecretClick} className="cursor-pointer select-none">2026</span> Prism. Все права защищены.
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
                        <h3 className="text-xl font-bold text-slate-900 mb-4">Вход в админ-панель</h3>

                        {loginError && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
                                {loginError}
                            </div>
                        )}

                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                            autoFocus
                        />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                            placeholder="Пароль"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
                        />
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowLoginModal(false);
                                    setLoginError('');
                                }}
                                className="flex-1 px-4 py-3 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleLogin}
                                disabled={loginLoading}
                                className="flex-1 px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loginLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                Войти
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Post Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-slate-900">Новый пост</h3>
                            <button
                                onClick={() => {
                                    setShowAddModal(false);
                                    removeCoverImage();
                                }}
                                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Cover Image Upload */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Обложка (опционально)
                            </label>
                            {coverPreview ? (
                                <div className="relative rounded-lg overflow-hidden">
                                    <img
                                        src={coverPreview}
                                        alt="Preview"
                                        className="w-full h-48 object-cover"
                                    />
                                    <button
                                        onClick={removeCoverImage}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-300 transition-colors"
                                >
                                    <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">Нажмите, чтобы загрузить обложку</p>
                                    <p className="text-xs text-slate-400 mt-1">PNG, JPG до 5MB</p>
                                </div>
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Заголовок"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-semibold text-slate-900"
                        />
                        <textarea
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Содержание поста..."
                            rows={10}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none text-slate-900"
                        />

                        {/* Upload Progress */}
                        {saving && uploadProgress > 0 && uploadProgress < 100 && (
                            <div className="mb-4">
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-indigo-500 transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    />
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Загрузка изображения...</p>
                            </div>
                        )}

                        <button
                            onClick={handleAddPost}
                            disabled={!newTitle.trim() || !newContent.trim() || saving}
                            className="w-full px-4 py-3 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? 'Публикация...' : 'Опубликовать'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Blog;
