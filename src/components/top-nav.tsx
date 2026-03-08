"use client";

import BuildIcon from "@mui/icons-material/Build";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import MenuIcon from "@mui/icons-material/Menu";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  ListItemText,
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
  { href: "/market", label: "Marketplace", icon: StorefrontIcon },
  { href: "/faq", label: "FAQ", icon: HelpOutlineIcon },
];

export function TopNav() {
  const pathname = usePathname();
  const { isAuthenticated, username, logout } = useAuth();
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [hamburgerAnchor, setHamburgerAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [userMenuAnchor, setUserMenuAnchor] = useState<null | HTMLElement>(
    null,
  );

  const handleLogout = () => {
    logout();
    setUserMenuAnchor(null);
  };

  return (
    <>
      <AppBar position="sticky" color="default" elevation={0}>
        <Toolbar sx={{ gap: 1, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Dungeon Cities
          </Typography>

          {/* ── Desktop nav (sm+) ────────────────────────────────────── */}
          <Box sx={{ display: { xs: "none", sm: "flex" }, gap: 0.5 }}>
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
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          {/* ── Auth (both breakpoints) ───────────────────────────────── */}
          {isAuthenticated ? (
            <>
              <IconButton
                onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                size="small"
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
                anchorEl={userMenuAnchor}
                open={Boolean(userMenuAnchor)}
                onClose={() => setUserMenuAnchor(null)}
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
            >
              <Box
                component="span"
                sx={{ display: { xs: "none", sm: "inline" } }}
              >
                Login
              </Box>
            </Button>
          )}

          {/* ── Hamburger (xs only) ───────────────────────────────────── */}
          <IconButton
            aria-label="open navigation menu"
            onClick={(e) => setHamburgerAnchor(e.currentTarget)}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Menu
            anchorEl={hamburgerAnchor}
            open={Boolean(hamburgerAnchor)}
            onClose={() => setHamburgerAnchor(null)}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            {navItems.map((item, idx) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return [
                idx > 0 && <Divider key={`d-${item.href}`} />,
                <MenuItem
                  key={item.href}
                  component={Link}
                  href={item.href}
                  selected={isActive}
                  onClick={() => setHamburgerAnchor(null)}
                >
                  <ListItemIcon>
                    <Icon
                      fontSize="small"
                      color={isActive ? "primary" : "inherit"}
                    />
                  </ListItemIcon>
                  <ListItemText>{item.label}</ListItemText>
                </MenuItem>,
              ];
            })}
          </Menu>
        </Toolbar>
      </AppBar>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  );
}
