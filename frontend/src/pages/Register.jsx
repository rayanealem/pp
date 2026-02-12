import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { Warehouse, Camera, Shield, Zap, Check } from 'lucide-react';

const tiers = [
    {
        id: 'free',
        name: 'Starter',
        price: 'Free',
        features: ['1 Camera', '50 Spots', 'Plate Match'],
        icon: Camera,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: '$49/mo',
        features: ['5 Cameras', 'Unlimited Spots', 'Smart Guide', 'Guest Pre-reg'],
        icon: Zap,
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        price: '$199/mo',
        features: ['Unlimited Cams', '2FA + Face Scan', 'Blacklist Alerts', 'Priority Support'],
        icon: Shield,
    },
];

export default function Register() {
    const [formData, setFormData] = useState({
        name: '',
        admin_email: '',
        admin_password: '',
        admin_name: '',
        plan_tier: 'free',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.post('/org/register', formData);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.detail || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-bg">
            <div className="glass-card animate-fade-in" style={{
                width: '100%', maxWidth: 560, padding: '2.5rem',
                position: 'relative', zIndex: 1,
            }}>
                {/* Brand */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: 'var(--gradient-brand)',
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '0.75rem', boxShadow: 'var(--shadow-glow-indigo)'
                    }}>
                        <Warehouse size={24} color="white" />
                    </div>
                    <h1 style={{
                        fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)',
                    }}>Create Organization</h1>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                        Choose a plan and set up your parking facility
                    </p>
                </div>

                {/* Error */}
                {error && (
                    <div style={{
                        padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                        background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.2)',
                        color: 'var(--accent-rose)', fontSize: '0.8rem', marginBottom: '1rem',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* Tier Selection */}
                <div className="tier-cards">
                    {tiers.map((tier) => {
                        const Icon = tier.icon;
                        return (
                            <div
                                key={tier.id}
                                className={`tier-card ${formData.plan_tier === tier.id ? 'selected' : ''}`}
                                onClick={() => setFormData({ ...formData, plan_tier: tier.id })}
                            >
                                <Icon size={20} style={{
                                    color: formData.plan_tier === tier.id ? 'var(--accent-indigo)' : 'var(--text-muted)',
                                    marginBottom: 4,
                                }} />
                                <div className="tier-name">{tier.name}</div>
                                <div className="tier-price">{tier.price}</div>
                                <div className="tier-features">
                                    {tier.features.map((f, i) => (
                                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
                                            <Check size={10} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                                            {f}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                        <div>
                            <label className="input-label">Organization Name</label>
                            <input className="input" placeholder="Acme Parking" required
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="input-label">Admin Full Name</label>
                            <input className="input" placeholder="John Doe" required
                                onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                        <label className="input-label">Admin Email</label>
                        <input type="email" className="input" placeholder="admin@company.com" required
                            onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} />
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label className="input-label">Password</label>
                        <input type="password" className="input" placeholder="Create a strong password" required
                            onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                        style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem' }}
                    >
                        {loading ? 'Creating...' : `Create ${tiers.find(t => t.id === formData.plan_tier)?.name} Account`}
                    </button>
                </form>

                <div style={{
                    textAlign: 'center', marginTop: '1.25rem',
                    paddingTop: '1.25rem', borderTop: '1px solid var(--border-glass)'
                }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Already have an account?{' '}
                    </span>
                    <Link to="/" style={{
                        fontSize: '0.8rem', color: 'var(--accent-indigo)',
                        textDecoration: 'none', fontWeight: 600,
                    }}>
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
