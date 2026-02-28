import React from 'react';

interface GlowCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: 'purple' | 'cyan' | 'pink' | 'gradient';
    intensity?: 'low' | 'medium' | 'high';
}

const glowColors = {
    purple: {
        border: 'hover:border-purple-500/40',
        shadow: 'hover:shadow-[0_0_30px_rgba(168,85,247,0.15)]',
        glow: 'rgba(168,85,247,0.3)',
    },
    cyan: {
        border: 'hover:border-cyan-500/40',
        shadow: 'hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]',
        glow: 'rgba(34,211,238,0.3)',
    },
    pink: {
        border: 'hover:border-pink-500/40',
        shadow: 'hover:shadow-[0_0_30px_rgba(236,72,153,0.15)]',
        glow: 'rgba(236,72,153,0.3)',
    },
    gradient: {
        border: 'hover:border-purple-500/30',
        shadow: 'hover:shadow-[0_0_40px_rgba(168,85,247,0.1),0_0_60px_rgba(34,211,238,0.1)]',
        glow: 'linear-gradient(135deg, rgba(168,85,247,0.3), rgba(34,211,238,0.3))',
    },
};

const intensityValues = {
    low: 'opacity-30',
    medium: 'opacity-50',
    high: 'opacity-70',
};

export const GlowCard: React.FC<GlowCardProps> = ({
    children,
    className = '',
    glowColor = 'purple',
    intensity = 'medium',
}) => {
    const colors = glowColors[glowColor];
    const intensityClass = intensityValues[intensity];

    return (
        <div
            className={`
        relative group overflow-hidden
        p-6 rounded-2xl
        bg-white/5 border border-white/10
        backdrop-blur-sm
        transition-all duration-500 ease-out
        hover:bg-white/[0.08]
        ${colors.border}
        ${colors.shadow}
        ${className}
      `}
        >
            {/* Animated glow orb that follows on hover */}
            <div
                className={`
          absolute -inset-2 rounded-3xl blur-2xl
          transition-opacity duration-500
          opacity-0 group-hover:${intensityClass}
          pointer-events-none
        `}
                style={{
                    background: colors.glow,
                }}
            />

            {/* Top gradient line accent */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content container */}
            <div className="relative z-10">
                {children}
            </div>

            {/* Subtle inner glow */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        </div>
    );
};

export default GlowCard;
