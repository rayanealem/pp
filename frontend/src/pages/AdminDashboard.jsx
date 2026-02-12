import React, { useEffect, useState, useRef, useCallback } from 'react';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';
import {
    LayoutDashboard, Camera, Users, LogOut, MapPin,
    TrendingUp, Wifi, WifiOff, ChevronRight, QrCode
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Donut Chart Component ────────────────────────────────────────
function DonutChart({ occupied, total }) {
    const size = 140;
    const stroke = 14;
    const radius = (size - stroke) / 2;
    const circumference = 2 * Math.PI * radius;
    const rate = total > 0 ? occupied / total : 0;
    const offset = circumference * (1 - rate);

    return (
        <div className="donut-container" style={{ width: size, height: size }}>
            <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="var(--bg-tertiary)" strokeWidth={stroke} />
                <circle cx={size / 2} cy={size / 2} r={radius}
                    fill="none" stroke="url(#grad)" strokeWidth={stroke}
                    strokeDasharray={circumference} strokeDashoffset={offset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
                <defs>
                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="var(--accent-indigo)" />
                        <stop offset="100%" stopColor="var(--accent-cyan)" />
                    </linearGradient>
                </defs>
            </svg>
            <div className="donut-label">
                <div className="value">{total > 0 ? Math.round(rate * 100) : 0}%</div>
                <div className="subtitle">Occupied</div>
            </div>
        </div>
    );
}

// ── Live Canvas Map ──────────────────────────────────────────────
function LiveMap({ spots, gridData }) {
    const canvasRef = useRef(null);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;

        const w = canvas.width;
        const h = canvas.height;

        // Background
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, w, h);

        // Draw grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gridSize = 30;
        for (let x = 0; x < w; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
        }
        for (let y = 0; y < h; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
        }

        // If we have actual grid data, render it
        if (gridData) {
            try {
                const grid = typeof gridData === 'string' ? JSON.parse(gridData) : gridData;
                const rows = grid.length;
                const cols = grid[0]?.length || 0;
                if (rows > 0 && cols > 0) {
                    const cellW = w / cols;
                    const cellH = h / rows;
                    for (let r = 0; r < rows; r++) {
                        for (let c = 0; c < cols; c++) {
                            const val = grid[r][c];
                            if (val === 1) {
                                ctx.fillStyle = 'rgba(255,255,255,0.06)';
                                ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
                            } else if (val === 2) {
                                ctx.fillStyle = 'rgba(52, 211, 153, 0.3)';
                                ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
                                ctx.strokeStyle = 'rgba(52, 211, 153, 0.5)';
                                ctx.strokeRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
                            } else if (val === 3) {
                                ctx.fillStyle = 'rgba(244, 63, 94, 0.3)';
                                ctx.fillRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
                                ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
                                ctx.strokeRect(c * cellW + 2, r * cellH + 2, cellW - 4, cellH - 4);
                            }
                        }
                    }
                    return;
                }
            } catch (e) { /* fallback to spot-based rendering */ }
        }

        // Fallback: render spots as positioned rectangles
        if (spots && spots.length > 0) {
            // Calculate scale to fit all spots
            const maxX = Math.max(...spots.map(s => s.x2 || 100));
            const maxY = Math.max(...spots.map(s => s.y2 || 100));
            const scaleX = (w - 40) / maxX;
            const scaleY = (h - 40) / maxY;
            const scale = Math.min(scaleX, scaleY);
            const offsetX = (w - maxX * scale) / 2;
            const offsetY = (h - maxY * scale) / 2;

            spots.forEach((spot) => {
                const sx = spot.x1 * scale + offsetX;
                const sy = spot.y1 * scale + offsetY;
                const sw = (spot.x2 - spot.x1) * scale;
                const sh = (spot.y2 - spot.y1) * scale;

                const isFree = spot.status === 'free';

                // Glow
                ctx.shadowColor = isFree ? 'rgba(52,211,153,0.3)' : 'rgba(244,63,94,0.3)';
                ctx.shadowBlur = 8;

                // Fill
                ctx.fillStyle = isFree ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)';
                ctx.beginPath();
                ctx.roundRect(sx, sy, sw, sh, 4);
                ctx.fill();

                // Border
                ctx.shadowBlur = 0;
                ctx.strokeStyle = isFree ? 'rgba(52,211,153,0.6)' : 'rgba(244,63,94,0.6)';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                // Label
                ctx.fillStyle = isFree ? 'rgba(52,211,153,0.9)' : 'rgba(244,63,94,0.9)';
                ctx.font = '10px Inter, sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(spot.name, sx + sw / 2, sy + sh / 2);
            });
        } else {
            // Empty state
            ctx.fillStyle = 'var(--text-muted)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No spots configured — add zones and spots via API', w / 2, h / 2);
        }
    }, [spots, gridData]);

    useEffect(() => {
        draw();
        const handleResize = () => draw();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    return <canvas ref={canvasRef} />;
}

// ── Main Dashboard ───────────────────────────────────────────────
export default function AdminDashboard() {
    const [zones, setZones] = useState([]);
    const [selectedZone, setSelectedZone] = useState(null);
    const [occupancy, setOccupancy] = useState(null);
    const [spots, setSpots] = useState([]);
    const [qrSpotId, setQrSpotId] = useState('1');
    const [wsConnected, setWsConnected] = useState(false);
    const [feedEvents, setFeedEvents] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const navigate = useNavigate();
    const wsRef = useRef(null);

    // ── Fetch data ───────────────────────────────────────────────
    useEffect(() => {
        fetchZones();
        fetchOccupancy();
        const interval = setInterval(fetchOccupancy, 10000);
        return () => clearInterval(interval);
    }, []);

    const fetchZones = async () => {
        try {
            const res = await api.get('/zones');
            setZones(res.data);
            if (res.data.length > 0) {
                setSelectedZone(res.data[0]);
                // Flatten spots from all zones
                const allSpots = res.data.flatMap(z => z.spots || []);
                setSpots(allSpots);
            }
        } catch (err) {
            console.error('Failed to fetch zones:', err);
        }
    };

    const fetchOccupancy = async () => {
        try {
            const res = await api.get('/analytics/occupancy');
            setOccupancy(res.data);
        } catch (err) {
            console.error('Failed to fetch occupancy:', err);
        }
    };

    // ── WebSocket ────────────────────────────────────────────────
    useEffect(() => {
        const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
        const wsUrl = `${protocol}://${window.location.host}/ws/spots`;

        function connect() {
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setWsConnected(true);
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.spot_id && data.status) {
                        // Update spot status in state
                        setSpots(prev => prev.map(s =>
                            s.id === data.spot_id ? { ...s, status: data.status } : s
                        ));
                        // Add to feed
                        setFeedEvents(prev => [{
                            id: Date.now(),
                            spotId: data.spot_id,
                            status: data.status,
                            time: new Date().toLocaleTimeString(),
                        }, ...prev].slice(0, 20));
                        // Refresh occupancy
                        fetchOccupancy();
                    }
                } catch (e) { /* ignore non-json */ }
            };

            ws.onclose = () => {
                setWsConnected(false);
                // Reconnect after 3 seconds
                setTimeout(connect, 3000);
            };

            ws.onerror = () => {
                setWsConnected(false);
            };
        }

        connect();
        return () => {
            if (wsRef.current) wsRef.current.close();
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/');
    };

    const occ = occupancy || { total_spots: 0, occupied_spots: 0, free_spots: 0, occupancy_rate: 0 };

    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside className="sidebar">
                <div className="sidebar-brand">
                    <h1>CloudPark</h1>
                    <span>Admin Console</span>
                </div>

                <nav className="sidebar-nav">
                    <button className={`sidebar-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                        onClick={() => setActiveTab('dashboard')}>
                        <LayoutDashboard size={18} />
                        Dashboard
                    </button>
                    <button className={`sidebar-link ${activeTab === 'cameras' ? 'active' : ''}`}
                        onClick={() => setActiveTab('cameras')}>
                        <Camera size={18} />
                        Cameras
                    </button>
                    <button className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`}
                        onClick={() => setActiveTab('users')}>
                        <Users size={18} />
                        Users
                    </button>
                    <button className={`sidebar-link ${activeTab === 'qr' ? 'active' : ''}`}
                        onClick={() => setActiveTab('qr')}>
                        <QrCode size={18} />
                        QR Generator
                    </button>
                </nav>

                <div style={{ padding: '0 0.75rem', marginTop: 'auto' }}>
                    <button className="sidebar-link" onClick={handleLogout}>
                        <LogOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* ── Main Content ─────────────────────────────────── */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', marginBottom: '2rem',
                }}>
                    <div>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
                            Dashboard
                        </h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Real-time parking facility overview
                        </p>
                    </div>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-sm)',
                        background: wsConnected ? 'rgba(52,211,153,0.1)' : 'rgba(244,63,94,0.1)',
                        border: `1px solid ${wsConnected ? 'rgba(52,211,153,0.2)' : 'rgba(244,63,94,0.2)'}`,
                    }}>
                        {wsConnected ?
                            <Wifi size={14} style={{ color: 'var(--accent-emerald)' }} /> :
                            <WifiOff size={14} style={{ color: 'var(--accent-rose)' }} />}
                        <span style={{
                            fontSize: '0.75rem', fontWeight: 600,
                            color: wsConnected ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }}>
                            {wsConnected ? 'Live' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* Stats Row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="glass-card stat-card indigo animate-slide-up delay-1">
                        <div className="stat-label">Total Spots</div>
                        <div className="stat-value">{occ.total_spots}</div>
                    </div>
                    <div className="glass-card stat-card danger animate-slide-up delay-2">
                        <div className="stat-label">Occupied</div>
                        <div className="stat-value" style={{ color: 'var(--accent-rose)' }}>{occ.occupied_spots}</div>
                    </div>
                    <div className="glass-card stat-card success animate-slide-up delay-3">
                        <div className="stat-label">Available</div>
                        <div className="stat-value" style={{ color: 'var(--accent-emerald)' }}>{occ.free_spots}</div>
                    </div>
                    <div className="glass-card stat-card info animate-slide-up delay-4">
                        <div className="stat-label">Zones Active</div>
                        <div className="stat-value">{zones.length}</div>
                    </div>
                </div>

                {/* Main Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1.5rem' }}>
                    {/* Left Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Live Map */}
                        <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                            <div style={{
                                display: 'flex', justifyContent: 'space-between',
                                alignItems: 'center', marginBottom: '1rem',
                            }}>
                                <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>
                                    <MapPin size={16} style={{
                                        display: 'inline', verticalAlign: '-2px',
                                        marginRight: '0.5rem', color: 'var(--accent-indigo)'
                                    }} />
                                    Live Parking Map
                                    {selectedZone && (
                                        <span style={{
                                            fontSize: '0.75rem', color: 'var(--text-muted)',
                                            fontWeight: 500, marginLeft: '0.5rem',
                                        }}>
                                            {selectedZone.name}
                                        </span>
                                    )}
                                </h2>

                                {zones.length > 1 && (
                                    <select
                                        style={{
                                            background: 'var(--bg-tertiary)', border: '1px solid var(--border-glass)',
                                            borderRadius: 'var(--radius-sm)', color: 'var(--text-secondary)',
                                            padding: '0.3rem 0.5rem', fontSize: '0.75rem', outline: 'none'
                                        }}
                                        onChange={(e) => {
                                            const z = zones.find(z => z.id === parseInt(e.target.value));
                                            setSelectedZone(z);
                                        }}
                                    >
                                        {zones.map(z => (
                                            <option key={z.id} value={z.id}>{z.name}</option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            <div className="live-map-container">
                                <LiveMap
                                    spots={selectedZone?.spots || spots}
                                    gridData={selectedZone?.map_grid_data}
                                />
                                <div className="map-legend">
                                    <span><span className="dot" style={{ background: 'var(--accent-emerald)' }} /> Free</span>
                                    <span><span className="dot" style={{ background: 'var(--accent-rose)' }} /> Occupied</span>
                                    <span><span className="dot" style={{ background: 'rgba(255,255,255,0.15)' }} /> Wall</span>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="glass-card-static" style={{ padding: '1.5rem' }}>
                            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
                                <QrCode size={16} style={{
                                    display: 'inline', verticalAlign: '-2px',
                                    marginRight: '0.5rem', color: 'var(--accent-indigo)'
                                }} />
                                Navigation QR Code
                            </h2>

                            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <div>
                                    <label className="input-label">Target Spot ID</label>
                                    <input
                                        type="number"
                                        className="input"
                                        value={qrSpotId}
                                        onChange={(e) => setQrSpotId(e.target.value)}
                                        style={{ width: 160 }}
                                        min="1"
                                    />
                                    <p style={{
                                        fontSize: '0.7rem', color: 'var(--text-muted)',
                                        marginTop: '0.5rem', lineHeight: 1.5,
                                    }}>
                                        Drivers scan this code to receive
                                        step-by-step parking directions
                                    </p>
                                </div>
                                <div className="qr-display">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/navigate/${qrSpotId}`}
                                        size={120}
                                        bgColor="#ffffff"
                                        fgColor="#0a0e1a"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Occupancy Donut */}
                        <div className="glass-card-static" style={{ padding: '1.5rem', textAlign: 'center' }}>
                            <h3 style={{
                                fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
                                marginBottom: '1rem',
                            }}>
                                Occupancy Rate
                            </h3>
                            <DonutChart occupied={occ.occupied_spots} total={occ.total_spots} />
                            <div style={{
                                display: 'flex', justifyContent: 'center', gap: '2rem',
                                marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)',
                            }}>
                                <span style={{ color: 'var(--accent-emerald)' }}>■ Free: {occ.free_spots}</span>
                                <span style={{ color: 'var(--accent-rose)' }}>■ Used: {occ.occupied_spots}</span>
                            </div>
                        </div>

                        {/* Activity Feed */}
                        <div className="glass-card-static" style={{ padding: '1.5rem', flex: 1, minHeight: 0 }}>
                            <h3 style={{
                                fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)',
                                marginBottom: '0.75rem',
                            }}>
                                <TrendingUp size={14} style={{
                                    display: 'inline', verticalAlign: '-2px', marginRight: '0.4rem'
                                }} />
                                Live Activity
                            </h3>

                            <div style={{ maxHeight: 340, overflowY: 'auto' }}>
                                {feedEvents.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center', padding: '2rem 0',
                                        color: 'var(--text-muted)', fontSize: '0.8rem',
                                    }}>
                                        <Wifi size={24} style={{ marginBottom: '0.5rem', opacity: 0.3 }} />
                                        <div>Waiting for events...</div>
                                        <div style={{ fontSize: '0.7rem', marginTop: '0.25rem' }}>
                                            Activity appears here in real-time
                                        </div>
                                    </div>
                                ) : (
                                    feedEvents.map((ev) => (
                                        <div key={ev.id} className="feed-item">
                                            <div className={`feed-dot ${ev.status}`} />
                                            <span className="feed-text">
                                                Spot #{ev.spotId} → <strong>{ev.status}</strong>
                                            </span>
                                            <span className="feed-time">{ev.time}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
