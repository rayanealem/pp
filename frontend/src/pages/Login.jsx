import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Warehouse, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const formData = new FormData();
            formData.append('username', email);
            formData.append('password', password);

            const response = await api.post('/auth/login', formData);
            localStorage.setItem('token', response.data.access_token);
            navigate('/admin');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="glass-card auth-card animate-fade-in">
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div style={{
                        width: 56, height: 56, borderRadius: 16,
                        background: 'var(--gradient-brand)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '1rem', boxShadow: 'var(--shadow-glow-indigo)'
                    }}>
                        <Warehouse size={28} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em',
                        background: 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>CloudPark</h1>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Intelligent Parking Management
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                        color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '1.25rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="input-label">Email Address</label>
                        <input
                            type="email"
                            className="input"
                            placeholder="admin@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
                        <label className="input-label">Password</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            className="input"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={{ paddingRight: '2.5rem' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute', right: 12, top: 32,
                                background: 'none', border: 'none', cursor: 'pointer',
                                color: 'var(--text-muted)', padding: 4,
                            }}
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                    >
                        {loading ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{
                                    width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)',
                                    borderTopColor: 'white', borderRadius: '50%',
                                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                                }} />
                                Signing in...
                            </span>
                        ) : 'Sign In'}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '1.5rem',
                    paddingTop: '1.5rem', borderTop: '1px solid var(--border-glass)'
                }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        New organization?{' '}
                    </span>
                    <Link to="/register" style={{
                        fontSize: '0.8rem', color: 'var(--accent-indigo)',
                        textDecoration: 'none', fontWeight: 600,
                    }}>
                        Register here
                    </Link>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
