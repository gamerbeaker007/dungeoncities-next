"use client";

import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
} from "@mui/material";
import Image from "next/image";
import { useState } from "react";
import { useAuth } from "../../providers/auth-provider";

type LoginDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function LoginDialog({ open, onClose }: LoginDialogProps) {
  const { login, isKeychainInstalled } = useAuth();
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim()) {
      setError("Please enter your username");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await login(username);

      if (result.success) {
        onClose();
        setUsername("");
      } else {
        console.error("[LoginDialog] Login failed:", result.error);
        setError(result.error || "Login failed");
      }
    } catch (err) {
      console.error("[LoginDialog] Login error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setUsername("");
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
          },
        },
      }}
    >
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Login with Hive Keychain</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {!isKeychainInstalled && (
              <Alert severity="warning">
                Hive Keychain extension is not installed. Please install it from
                your browser&apos;s extension store.
              </Alert>
            )}

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              label="Hive Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading || !isKeychainInstalled}
              fullWidth
              autoFocus
              placeholder="Enter your Hive username"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !username.trim()}
            fullWidth
            sx={{
              ml: 2,
              mr: 2,
              minHeight: 48,
              minWidth: 120,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Image
              src="/images/HiveKeychainInlogButton.png"
              alt="Sign In with Keychain"
              fill
              sizes="(max-width: 600px) 100vw, 120px"
              style={{
                objectFit: "contain",
                opacity: isLoading || !username.trim() ? 0.5 : 1,
              }}
            />{" "}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
