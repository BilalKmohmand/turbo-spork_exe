import { useEffect, useRef } from "react";

import libraryVideo from "@assets/generated_videos/cinematic_student_library_scene.mp4";
import classroomVideo from "@assets/generated_videos/collaborative_classroom_scene.mp4";
import typingVideo from "@assets/generated_videos/focused_typing_hands_scene.mp4";
import neuralVideo from "@assets/generated_videos/neural_network_abstract_visuals.mp4";

export type VideoType = "library" | "classroom" | "typing" | "neural";

const videoSources: Record<VideoType, string> = {
  library: libraryVideo,
  classroom: classroomVideo,
  typing: typingVideo,
  neural: neuralVideo,
};

interface BackgroundVideoProps {
  video: VideoType;
  overlay?: "dark" | "darker" | "darkest";
  className?: string;
}

export function BackgroundVideo({ video, overlay = "dark", className = "" }: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  const overlayClasses = {
    dark: "bg-black/60",
    darker: "bg-black/75",
    darkest: "bg-black/85",
  };

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <video
        ref={videoRef}
        src={videoSources[video]}
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
        data-testid={`video-bg-${video}`}
      />
      <div className={`absolute inset-0 ${overlayClasses[overlay]}`} />
    </div>
  );
}
