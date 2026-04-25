import { createContext, useContext, useState, useCallback } from "react";
import Snackbar from "@mui/joy/Snackbar";

const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
    const [toast, setToast] = useState({
        open: false,
        message: "",
        color: "neutral",
    });

    const showToast = useCallback((message, color = "neutral", duration = 3000) => {
        setToast({ open: true, message, color, duration });
    }, []);

    const handleClose = () => setToast(prev => ({ ...prev, open: false }));

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Snackbar global */}
            <Snackbar
                open={toast.open}
                onClose={handleClose}
                color={toast.color}
                variant="soft"
                autoHideDuration={toast.duration || 3000}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
                sx={{ top: "calc(var(--mobile-header-height, 0px) + 8px) !important" }}
            >
                {toast.message}
            </Snackbar>
        </ToastContext.Provider>
    );
};

export const useToast = () => useContext(ToastContext);
