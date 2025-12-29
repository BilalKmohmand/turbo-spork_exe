import { useEffect, useRef, useState } from "react";

import libraryVideo from "@assets/generated_videos/cinematic_student_library_scene.mp4";
import classroomVideo from "@assets/generated_videos/collaborative_classroom_scene.mp4";
import typingVideo from "@assets/generated_videos/focused_typing_hands_scene.mp4";
import neuralVideo from "@assets/generated_videos/neural_network_abstract_visuals.mp4";
import mathVideo from "@assets/generated_videos/math_equations_visualization.mp4";

export type VideoType = "library" | "classroom" | "typing" | "neural" | "math";

const videoSources: Record<VideoType, string> = {
  library: libraryVideo,
  classroom: classroomVideo,
  typing: typingVideo,
  neural: neuralVideo,
  math: mathVideo,
};

interface BackgroundVideoProps {
  video: VideoType;
  overlay?: "dark" | "darker" | "darkest";
  className?: string;
}

export function BackgroundVideo({ video, overlay = "dark", className = "" }: BackgroundVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(motionQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    motionQuery.addEventListener("change", handleChange);
    return () => motionQuery.removeEventListener("change", handleChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { 
        rootMargin: "100px",
        threshold: 0.1 
      }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl || prefersReducedMotion) return;

    if (isVisible) {
      videoEl.play().catch(() => {});
    } else {
      videoEl.pause();
    }
  }, [isVisible, prefersReducedMotion]);

  const overlayClasses = {
    dark: "bg-black/60",
    darker: "bg-black/75",
    darkest: "bg-black/85",
  };

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className}`}>
      {isVisible && !prefersReducedMotion && (
        <video
          ref={videoRef}
          src={videoSources[video]}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover"
          data-testid={`video-bg-${video}`}
        />
      )}
      <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
    </div>
  );
}
