import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import "./config/i18n";
// import { CssBaseline, CssVarsProvider, extendTheme } from "@mui/joy/";
import { AppThemeProvider } from "./context/AppThemeContext.jsx";

import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

import { GlobalStyles } from "./constants/GlobalStyle";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastProvider } from "./context/ToastContext";
import { sileo, Toaster } from "sileo";
import { TooltipProvider } from "./components/ui/tooltip.jsx";

// 🎨 Crea un theme extendido con la fuente Poppins
// const theme = extendTheme({
//   fontFamily: {
//     body: "Poppins, sans-serif",
//     display: "Poppins, sans-serif",
//   },
//   defaultColorScheme: "light",
// });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppThemeProvider>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <GlobalStyles />
        <TooltipProvider>
          <ToastProvider>
            <Toaster
              position="top-center"
              style={{ top: "calc(var(--mobile-header-height, 0px) + 8px)" }}
            />
            <App />
          </ToastProvider>
        </TooltipProvider>
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss={false}
          draggable
          pauseOnHover={false}
          theme="light"
          style={{ top: "calc(var(--mobile-header-height, 0px) + 8px)" }}
        />
      </LocalizationProvider>
    </AppThemeProvider>
  </React.StrictMode>,
);
