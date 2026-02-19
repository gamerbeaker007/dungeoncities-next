"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuth } from "../../providers/auth-provider";

export function LoginForm() {
  const { login, isKeychainInstalled, isAuthenticated, username, logout } =
    useAuth();
  const [inputUsername, setInputUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    const result = await login(inputUsername);

    if (!result.success) {
      setError(result.error || "Login failed");
    } else {
      setInputUsername("");
    }

    setIsLoading(false);
  };

  if (!isKeychainInstalled) {
    return (
      <Alert severity="warning">
        Hive Keychain extension not found. Please install it from your browser
        extension store.
      </Alert>
    );
  }

  if (isAuthenticated && username) {
    return (
      <Card>
        <CardContent>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Welcome, {username}!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You are logged in
            </Typography>
            <Button variant="outlined" color="error" onClick={logout}>
              Logout
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Login with Hive Keychain
        </Typography>
        <Box component="form" onSubmit={handleLogin} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="Hive Username"
            value={inputUsername}
            onChange={(e) => setInputUsername(e.target.value)}
            disabled={isLoading}
            required
            sx={{ mb: 2 }}
          />
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={isLoading || !inputUsername}
            startIcon={isLoading ? <CircularProgress size={20} /> : null}
          >
            {isLoading ? "Signing in..." : "Login"}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
