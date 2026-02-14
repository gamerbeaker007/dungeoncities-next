"use client";

import BuildIcon from "@mui/icons-material/Build";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Resource Search", icon: SearchIcon },
  { href: "/forge", label: "Forge Search", icon: BuildIcon },
  { href: "/undiscovered", label: "Undiscovered", icon: VisibilityOffIcon },
  { href: "/faq", label: "FAQ", icon: HelpOutlineIcon },
];

export function TopNav() {
  const pathname = usePathname();

  return (
    <AppBar position="sticky" color="default" elevation={0}>
      <Toolbar sx={{ gap: 2, borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Dungeon Cities
        </Typography>

        <Box sx={{ display: "flex", gap: 1 }}>
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
        </Box>
      </Toolbar>
    </AppBar>
  );
}
