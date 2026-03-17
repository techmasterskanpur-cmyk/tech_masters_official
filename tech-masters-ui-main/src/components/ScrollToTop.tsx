import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll window
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // Fallback: If a specific wrapper is handling scrolling due to Tailwind h-screen or similar:
    const mainHtml = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    
    if (mainHtml) mainHtml.scrollTop = 0;
    if (body) body.scrollTop = 0;
    if (root) root.scrollTop = 0;

  }, [pathname, search]); // Added search so that changing query params (like clicking a category from footer) also triggers scroll

  return null;
}
