import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import {
    ArrowUp, ArrowDown, ArrowRight, ArrowLeft,
    CheckCircle, Loader, AlertTriangle, MapPin
} from 'lucide-react';

const directionConfig = {
    UP: { icon: ArrowUp, label: 'Go Straight', color: 'var(--accent-indigo)' },
    FORWARD: { icon: ArrowUp, label: 'Go Straight', color: 'var(--accent-indigo)' },
    DOWN: { icon: ArrowDown, label: 'Go Straight', color: 'var(--accent-indigo)' },
    RIGHT: { icon: ArrowRight, label: 'Turn Right', color: 'var(--accent-cyan)' },
    LEFT: { icon: ArrowLeft, label: 'Turn Left', color: 'var(--accent-amber)' },
    ARRIVED: { icon: CheckCircle, label: 'You\'ve Arrived!', color: 'var(--accent-emerald)' },
    ERROR: { icon: AlertTriangle, label: 'Route Error', color: 'var(--accent-rose)' },
};

export default function DriverNavigation() {
    const { spotId } = useParams();
    const [step, setStep] = useState(0);
    const [instructions, setInstructions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchInstructions = async () => {
            try {
                const response = await api.get(`/navigation/route?target_spot_id=${spotId}`);
                if (response.data.instructions && response.data.instructions.length > 0) {
                    setInstructions([...response.data.instructions, 'ARRIVED']);
                } else {
                    setInstructions(['ARRIVED']);
                }
            } catch (error) {
                console.error('Failed to fetch instructions:', error);
                setInstructions(['ERROR']);
            } finally {
                setLoading(false);
            }
        };
        fetchInstructions();
    }, [spotId]);

    const currentInstruction = instructions[step] || 'ARRIVED';
    const config = directionConfig[currentInstruction] || directionConfig.UP;
    const Icon = config.icon;
    const isLast = step >= instructions.length - 1;
    const isArrived = currentInstruction === 'ARRIVED';

    const nextStep = () => {
        if (!isLast) setStep(step + 1);
    };

    if (loading) {
        return (
            <div className="driver-bg" style={{
                alignItems: 'center', justifyContent: 'center',
            }}>
                <Loader size={48} style={{
                    color: 'var(--accent-indigo)',
                    animation: 'spin 1s linear infinite',
                }} />
                <p style={{
                    marginTop: '1.5rem', fontSize: '1.1rem',
                    fontWeight: 600, color: 'var(--text-secondary)',
                }}>
                    Calculating route...
                </p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="driver-bg" onClick={!isArrived ? nextStep : undefined}
            style={{ cursor: isArrived ? 'default' : 'pointer', userSelect: 'none' }}
        >
            {/* Top bar */}
            <div style={{
                padding: '1.25rem 1.5rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                position: 'relative', zIndex: 2,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <MapPin size={18} style={{ color: 'var(--accent-indigo)' }} />
                    <span style={{
                        fontSize: '0.9rem', fontWeight: 700,
                        background: 'var(--gradient-brand)',
                        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>
                        CloudPark
                    </span>
                </div>
                <div style={{
                    fontSize: '0.75rem', color: 'var(--text-muted)',
                    padding: '0.3rem 0.6rem',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: 'var(--radius-sm)',
                }}>
                    Spot #{spotId}
                </div>
            </div>

            {/* Main Step Display */}
            <div style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '2rem', position: 'relative', zIndex: 2,
            }}>
                <div className={`driver-step-icon ${isArrived ? 'arrived' : ''}`}
                    style={{ marginBottom: '2rem' }}
                >
                    <Icon size={72} style={{ color: config.color }} />
                </div>

                <h1 style={{
                    fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em',
                    color: config.color, textAlign: 'center',
                }}>
                    {config.label}
                </h1>

                {!isArrived && (
                    <p style={{
                        fontSize: '1rem', color: 'var(--text-secondary)',
                        marginTop: '0.5rem',
                    }}>
                        Step {step + 1} of {instructions.length - 1}
                    </p>
                )}

                {isArrived && (
                    <p style={{
                        fontSize: '1rem', color: 'var(--accent-emerald)',
                        marginTop: '0.75rem', fontWeight: 600,
                    }}>
                        🅿️ Spot #{spotId} is here
                    </p>
                )}

                {!isArrived && (
                    <p style={{
                        fontSize: '0.8rem', color: 'var(--text-muted)',
                        marginTop: '2rem',
                    }}>
                        Tap anywhere to continue
                    </p>
                )}
            </div>

            {/* Progress Bar */}
            <div style={{
                padding: '1.5rem', position: 'relative', zIndex: 2,
            }}>
                <div className="driver-progress">
                    {instructions.map((_, i) => (
                        <div
                            key={i}
                            className={`step-dot ${i < step ? 'completed' : ''} ${i === step ? 'current' : ''}`}
                        />
                    ))}
                </div>

                {/* Target card */}
                <div style={{
                    marginTop: '1rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.25rem',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                    <div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Destination
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '0.125rem' }}>
                            Spot #{spotId}
                        </div>
                    </div>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <MapPin size={20} style={{ color: 'var(--accent-emerald)' }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
