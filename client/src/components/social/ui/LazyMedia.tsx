import React, { useEffect, useRef, useState } from "react";

type LazyMediaProps = {
    src: string;
    alt?: string;
    isSingle?: boolean;
    isPreview?: boolean;
};

const LazyMedia: React.FC<LazyMediaProps> = ({ src, alt, isSingle = false, isPreview }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, []);

    const getMediaType = (url: string): "image" | "video" | "audio" | "pdf" | "unknown" => {
        const lower = url.toLowerCase();
        if (lower.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|svg)(\?.*)?$/)) return "image";
        if (lower.match(/\.(mp4|webm|ogg|mov|mkv)(\?.*)?$/)) return "video";
        if (lower.match(/\.(mp3|wav|aac|flac|m4a)(\?.*)?$/)) return "audio";
        if (lower.match(/\.(pdf)(\?.*)?$/)) return "pdf";
        return "unknown";
    };

    const mediaType = getMediaType(src);

    return (
        <div
            ref={ref}
            className={`
                relative rounded-lg overflow-hidden bg-muted
                ${isSingle ? "w-full max-w-2xl mx-auto" : "min-h-[120px]"}
                ${isPreview ? "w-full h-full" : ""}
                flex justify-center items-center
            `}
            style={{ minHeight: mediaType === "image" ? 200 : undefined }} // Example fixed space
        >
            {isVisible && (
                <>
                    {mediaType === "image" && (
                        <img
                            src={src}
                            alt={alt}
                            className="w-full max-w-full max-h-[500px] h-auto object-contain rounded-lg"
                            loading="lazy"
                        />
                    )}
                    {mediaType === "video" && (
                        <video
                            src={src}
                            controls
                            preload="none"
                            className="w-full rounded-lg"
                            controlsList="nodownload"
                        />
                    )}
                    {mediaType === "audio" && (
                        <audio
                            src={src}
                            controls
                            preload="none"
                            className="w-full rounded-lg"
                        />
                    )}
                    {mediaType === "pdf" && (
                        <iframe
                            src={src}
                            title={alt ?? "Document preview"}
                            className="w-full min-h-[500px] rounded-lg border"
                        />
                    )}
                    {mediaType === "unknown" && (
                        <a
                            href={src}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 underline"
                        >
                            Open file
                        </a>
                    )}
                </>
            )}
        </div>
    );
};

export default LazyMedia;
