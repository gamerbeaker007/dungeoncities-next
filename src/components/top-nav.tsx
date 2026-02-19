"use client";

import BuildIcon from "@mui/icons-material/Build";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Toolbar,
  Typography,
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "../providers/auth-provider";
import { LoginDialog } from "./login/login-dialog";

const navItems = [
  { href: "/", label: "Resource Search", icon: SearchIcon },
  { href: "/forge", label: "Forge Search", icon: BuildIcon },
  { href: "/undiscovered", label: "Undiscovered", icon: VisibilityOffIcon },
  { href: "/faq", label: "FAQ", icon: HelpOutlineIcon },
];

export function TopNav() {
  const pathname = usePathname();
  const { isAuthenticated, username, logout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleUserMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleUserMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleUserMenuClose();
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dungeon Cities
          </Typography>

          <Box sx={{ display: "flex", gap: 0.5 }}>
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Button
                  key={item.href}
                  component={Link}
                  suppressHydrationWarning
                  href={item.href}
                  variant={isActive ? "contained" : "outlined"}
                  startIcon={<Icon />}
                  sx={{
                    "& .MuiButton-startIcon": {
                      marginRight: { xs: 0, sm: "8px" },
                    },
                    minWidth: { xs: "auto", sm: "64px" },
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    {item.label}
                  </Box>
                </Button>
              );
            })}
            {/* Login/User Menu */}
            <Box>
              {isAuthenticated ? (
                <>
                  <IconButton
                    onClick={handleUserMenuOpen}
                    size="small"
                    sx={{ ml: 1 }}
                    aria-label="user menu"
                  >
                    <Avatar sx={{ width: 32, height: 32 }}>
                      <Image
                        src={`https://images.hive.blog/u/${username}/avatar`}
                        alt={`${username}`}
                        width={32}
                        height={32}
                      />
                    </Avatar>
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleUserMenuClose}
                  >
                    <MenuItem disabled>
                      <Typography variant="body2" color="text.secondary">
                        {username}
                      </Typography>
                    </MenuItem>
                    <MenuItem onClick={handleLogout}>
                      <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                      Logout
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<LoginIcon />}
                  onClick={() => setLoginDialogOpen(true)}
                  sx={{
                    "& .MuiButton-startIcon": {
                      marginRight: { xs: 0, sm: "8px" },
                    },
                    minWidth: { xs: "auto", sm: "64px" },
                    px: { xs: 1.5, sm: 2 },
                  }}
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: "none", sm: "inline" } }}
                  >
                    Login
                  </Box>
                </Button>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  );
}
