"use client";

import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Resource Search" },
  { href: "/forge", label: "Forge Search" },
  { href: "/faq", label: "FAQ" },
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

            return (
              <Button
                key={item.href}
                component={Link}
                suppressHydrationWarning
                href={item.href}
                variant={isActive ? "contained" : "outlined"}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
