import React, { useState } from 'react';

// Inline SVG placeholder – works even if /public/images/fallback is missing
const INLINE_FALLBACK =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='%23f3f0eb'/%3E%3Ccircle cx='200' cy='150' r='60' fill='%23d4a96a' opacity='0.4'/%3E%3Crect x='160' y='210' width='80' height='110' rx='8' fill='%23d4a96a' opacity='0.5'/%3E%3Ctext x='200' y='360' text-anchor='middle' font-family='Georgia' font-size='16' fill='%23999'%3ENo Image%3C/text%3E%3C/svg%3E";

// Primary local fallback – relative path to public folder
const LOCAL_FALLBACK = "/images/product-placeholder.svg";

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string | undefined | null;
    fallback?: string;
    /** Called when the image loads successfully */
    onSuccessLoad?: () => void;
}

/**
 * SafeImage – A robust image component that:
 * 1. Accepts any URL including Supabase Storage public URLs
 * 2. Shows a skeleton shimmer while loading
 * 3. Falls back to an inline SVG placeholder if loading fails
 * 4. Prevents infinite fallback loops
 */
const SafeImage: React.FC<SafeImageProps> = ({
    src,
    fallback = INLINE_FALLBACK,
    alt = 'Product image',
    className = '',
    onSuccessLoad,
    style,
    ...rest
}) => {
    // Initial source logic: if it doesn't look like a URL and isn't a relative path, use fallback
    const getInitialSrc = () => {
        if (!src) return fallback;
        if (typeof src !== 'string') return fallback;
        // If it's a Supabase URL that doesn't start with https (safety check), use fallback
        if (src.includes('supabase.co') && !src.startsWith('https')) return LOCAL_FALLBACK;
        return src;
    };

    const [imgSrc, setImgSrc] = useState<string>(getInitialSrc());
    const [loaded, setLoaded] = useState(false);
    const [errored, setErrored] = useState(false);
    const [attemptedLocal, setAttemptedLocal] = useState(false);

    // When src prop changes, reset state
    React.useEffect(() => {
        const newSrc = getInitialSrc();
        setImgSrc(newSrc);
        setLoaded(false);
        setErrored(false);
        setAttemptedLocal(false);
    }, [src]);

    const handleLoad = () => {
        setLoaded(true);
        setErrored(false);
        onSuccessLoad?.();
    };

    const handleError = () => {
        // 1. If it's a Supabase direct URL and we haven't tried proxy yet, try proxy
        const SUPABASE_STORAGE_RE = /https?:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\/public\/products\//;
        if (imgSrc.match(SUPABASE_STORAGE_RE) && !imgSrc.includes('/api/images/proxy/')) {
            const match = imgSrc.match(SUPABASE_STORAGE_RE);
            const filename = imgSrc.slice(match!.index! + match![0].length);
            const BACKEND_URL = window.location.origin.includes('localhost')
                ? 'http://localhost:5000'
                : 'https://bhatkar-fragrance-hub-1.onrender.com';

            setImgSrc(`${BACKEND_URL}/api/images/proxy/${filename}`);
            return;
        }

        // 2. If proxy/other failed, try the local fallback image
        if (!attemptedLocal && imgSrc !== LOCAL_FALLBACK) {
            setImgSrc(LOCAL_FALLBACK);
            setAttemptedLocal(true);
        } else if (!errored) {
            // 3. Final safety net: inline SVG
            setErrored(true);
            setImgSrc(fallback);
            setLoaded(true);
        }
    };

    return (
        <div
            style={{
                position: 'relative',
                overflow: 'hidden',
                background: '#f3f0eb',
                ...style,
            }}
            className={className}
        >
            {/* Skeleton shimmer while loading */}
            {!loaded && (
                <div
                    aria-hidden="true"
                    style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(90deg, #f0ece4 25%, #e8e0d4 50%, #f0ece4 75%)',
                        backgroundSize: '200% 100%',
                        animation: 'safeImageShimmer 1.4s ease-in-out infinite',
                        zIndex: 1,
                    }}
                />
            )}

            <img
                {...rest}
                src={imgSrc}
                alt={errored ? `${alt} (unavailable)` : alt}
                loading="lazy"
                decoding="async"
                onLoad={handleLoad}
                onError={handleError}
                style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    opacity: loaded ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                }}
            />

            {/* Shimmer keyframe injection – only once globally */}
            <style>{`
        @keyframes safeImageShimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
        </div>
    );
};

export default SafeImage;
