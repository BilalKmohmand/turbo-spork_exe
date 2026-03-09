import { useEffect } from "react";

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
}

export function SEOHead({
  title = "TheHighGrader - AI-Powered Education Platform",
  description = "Upload homework, get instant AI solutions, and improve your learning. TheHighGrader helps students succeed with AI-powered tutoring, quiz generation, essay writing, and lecture note generation.",
  keywords = "AI education, homework help, AI tutor, quiz generator, essay writer, lecture notes, student learning, math solver",
  ogImage = "/og-image.png",
  ogType = "website",
}: SEOHeadProps) {
  useEffect(() => {
    document.title = title;

    const updateMeta = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement("meta");
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", content);
    };

    updateMeta("description", description);
    updateMeta("keywords", keywords);
    updateMeta("og:title", title, true);
    updateMeta("og:description", description, true);
    updateMeta("og:type", ogType, true);
    updateMeta("og:image", ogImage, true);
    updateMeta("twitter:card", "summary_large_image");
    updateMeta("twitter:title", title);
    updateMeta("twitter:description", description);
  }, [title, description, keywords, ogImage, ogType]);

  return null;
}
