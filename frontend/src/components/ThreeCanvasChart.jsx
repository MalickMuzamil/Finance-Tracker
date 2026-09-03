import React, { useRef, useEffect, useState } from 'react';
import { formatPKR } from '../utils/currency';
import { Sparkles } from 'lucide-react';

export default function ThreeCanvasChart({
  income = 0,
  expense = 0,
  car = 0,
  bike = 0,
  given = 0,
  received = 0,
  netCashFlow = 0,
  className = '',
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [hoveredBar, setHoveredBar] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const data = [
    { label: 'Income', shortLabel: 'Income', value: Number(income) || 0, color: '#10b981', glow: 'rgba(16, 185, 129, 0.6)' },
    { label: 'Home Expense', shortLabel: 'Home', value: Number(expense) || 0, color: '#f43f5e', glow: 'rgba(244, 63, 94, 0.6)' },
    { label: 'Car Expense', shortLabel: 'Car', value: Number(car) || 0, color: '#38bdf8', glow: 'rgba(56, 189, 248, 0.6)' },
    { label: 'Bike Expense', shortLabel: 'Bike', value: Number(bike) || 0, color: '#c084fc', glow: 'rgba(192, 132, 252, 0.6)' },
    { label: 'Udhaar Diya', shortLabel: 'Diya', value: Number(given) || 0, color: '#fbbf24', glow: 'rgba(251, 191, 36, 0.6)' },
    { label: 'Udhaar Liya', shortLabel: 'Liya', value: Number(received) || 0, color: '#f97316', glow: 'rgba(249, 115, 22, 0.6)' },
    { label: 'Net Cash Flow', shortLabel: 'Net', value: Number(netCashFlow) || 0, color: '#6366f1', glow: 'rgba(99, 102, 241, 0.6)' },
  ];

  const maxVal = Math.max(...data.map((d) => Math.abs(d.value)), 1000);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId;
    let targetTiltX = 0;
    let targetTiltY = 0;
    let currentTiltX = 0;
    let currentTiltY = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resize();
    window.addEventListener('resize', resize);

    // 3D Particles
    const particles = Array.from({ length: 35 }).map(() => ({
      x: (Math.random() - 0.5) * 500,
      y: (Math.random() - 0.5) * 260,
      z: Math.random() * 300 - 150,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.3 + 0.15,
      opacity: Math.random() * 0.45 + 0.15,
    }));

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      targetTiltX = (x / rect.width - 0.5) * 0.45;
      targetTiltY = (y / rect.height - 0.5) * 0.35;
      setMousePos({ x, y });
    };

    const handleTouchMove = (e) => {
      if (!e.touches[0]) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      const y = e.touches[0].clientY - rect.top;
      targetTiltX = (x / rect.width - 0.5) * 0.45;
      targetTiltY = (y / rect.height - 0.5) * 0.35;
      setMousePos({ x, y });
    };

    const handleMouseLeave = () => {
      targetTiltX = 0;
      targetTiltY = 0;
      setHoveredBar(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    const render = () => {
      currentTiltX += (targetTiltX - currentTiltX) * 0.08;
      currentTiltY += (targetTiltY - currentTiltY) * 0.08;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const isMobile = width < 560;

      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height * (isMobile ? 0.72 : 0.68);

      ctx.save();
      ctx.translate(cx, cy);

      // Floor 3D Grid
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let i = -4; i <= 4; i++) {
        const gx = i * (isMobile ? 32 : 44);
        ctx.beginPath();
        ctx.moveTo(gx - 60 + currentTiltX * 30, -30 + currentTiltY * 15);
        ctx.lineTo(gx + 60 + currentTiltX * 30, 60 + currentTiltY * 15);
        ctx.stroke();
      }

      // 3D Particles
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < -130) p.y = 130;
        const scale = 250 / (250 + p.z);
        const px = p.x * scale + currentTiltX * 40;
        const py = p.y * scale + currentTiltY * 25 - 30;
        ctx.fillStyle = `rgba(56, 189, 248, ${p.opacity * scale})`;
        ctx.beginPath();
        ctx.arc(px, py, p.size * scale, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3D Bars Calculation
      const barSpacingRatio = isMobile ? 1.6 : 1.9;
      const barWidth = Math.min(isMobile ? 22 : 36, width / (data.length * barSpacingRatio));
      const barDepth = barWidth * 0.6;
      const totalSpan = data.length * (barWidth * barSpacingRatio);
      const startX = -totalSpan / 2 + (barWidth * barSpacingRatio) / 2;

      let foundHover = null;

      data.forEach((item, index) => {
        const x = startX + index * (barWidth * barSpacingRatio) + currentTiltX * 25;
        const barHeightMax = height * (isMobile ? 0.48 : 0.44);
        const h = Math.max(8, (Math.abs(item.value) / maxVal) * barHeightMax);
        const y = 0 + currentTiltY * 15;

        // Hover test
        const screenBarX = cx + x;
        const screenBarY = cy + y - h;
        if (
          mousePos.x >= screenBarX - barWidth / 2 - 4 &&
          mousePos.x <= screenBarX + barWidth / 2 + barDepth + 4 &&
          mousePos.y >= screenBarY - 10 &&
          mousePos.y <= cy + y + 10
        ) {
          foundHover = item;
        }

        // 3D Bar Front Face
        ctx.fillStyle = item.color;
        ctx.shadowColor = item.glow;
        ctx.shadowBlur = isMobile ? 8 : 14;
        ctx.beginPath();
        ctx.rect(x - barWidth / 2, y - h, barWidth, h);
        ctx.fill();
        ctx.shadowBlur = 0;

        // 3D Bar Top Face (Isometric)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.moveTo(x - barWidth / 2, y - h);
        ctx.lineTo(x - barWidth / 2 + barDepth * 0.7, y - h - barDepth * 0.4);
        ctx.lineTo(x + barWidth / 2 + barDepth * 0.7, y - h - barDepth * 0.4);
        ctx.lineTo(x + barWidth / 2, y - h);
        ctx.closePath();
        ctx.fill();

        // 3D Bar Right Face (Isometric)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.moveTo(x + barWidth / 2, y - h);
        ctx.lineTo(x + barWidth / 2 + barDepth * 0.7, y - h - barDepth * 0.4);
        ctx.lineTo(x + barWidth / 2 + barDepth * 0.7, y - barDepth * 0.4);
        ctx.lineTo(x + barWidth / 2, y);
        ctx.closePath();
        ctx.fill();

        // Front Face Gradient
        const grad = ctx.createLinearGradient(0, y - h, 0, y);
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
        ctx.fillStyle = grad;
        ctx.fillRect(x - barWidth / 2, y - h, barWidth, h);

        // Render clean labels on Desktop only to prevent mobile cramping
        if (!isMobile) {
          ctx.fillStyle = '#94a3b8';
          ctx.font = '600 11px Outfit, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(item.shortLabel, x, y + 20);

          if (item.value > 0 || item.value < 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = '700 10px Outfit, sans-serif';
            ctx.fillText(formatPKR(item.value), x + barDepth * 0.35, y - h - barDepth * 0.4 - 8);
          }
        }
      });

      ctx.restore();

      setHoveredBar(foundHover);
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [data, maxVal, mousePos]);

  return (
    <div className={`threeChartCard ${className}`} ref={containerRef}>
      <div className="threeChartHeader">
        <div className="threeChartTitleGroup">
          <div className="chartTag">
            <Sparkles size={13} className="sparkleIcon" />
            <span>3D Interactive Visualizer</span>
          </div>
          <h3>3D Cash Flow & Expense Distribution</h3>
        </div>
      </div>

      <div className="threeCanvasWrapper">
        <canvas ref={canvasRef} className="threeCanvas" />

        {hoveredBar && (
          <div
            className="threeTooltip"
            style={{
              left: `${Math.min(mousePos.x + 10, 240)}px`,
              top: `${Math.max(mousePos.y - 50, 10)}px`,
            }}
          >
            <strong style={{ color: hoveredBar.color }}>{hoveredBar.label}</strong>
            <span>{formatPKR(hoveredBar.value)}</span>
          </div>
        )}
      </div>

      {/* Color-Coded Breakdown Grid with Dots */}
      <div className="threeLegendGrid">
        {data.map((d) => (
          <div key={d.label} className="legendPillCard">
            <span className="legendDot" style={{ backgroundColor: d.color, boxShadow: `0 0 8px ${d.glow}` }} />
            <div className="legendInfo">
              <span className="legendLabel">{d.label}</span>
              <strong className="legendValue" style={{ color: d.value > 0 ? '#fff' : 'var(--muted)' }}>
                {formatPKR(d.value)}
              </strong>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
