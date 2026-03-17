import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// ✅ Import Google Provider
import { GoogleOAuthProvider } from '@react-oauth/google';

// ✅ Your exact Google Client ID
const GOOGLE_CLIENT_ID = "448219364116-04h6qeptgrchpinano8brianqcfed6nc.apps.googleusercontent.com"

createRoot(document.getElementById("root")!).render(
  // ✅ App is wrapped securely
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);