"use client";

import SearchIcon from "@mui/icons-material/Search";
import { Box, InputAdornment, TextField } from "@mui/material";
import { useEffect, useState } from "react";

type SearchFormProps = {
  query: string;
  onSubmit: (query: string) => void;
};

export function SearchForm({ query, onSubmit }: SearchFormProps) {
  const [value, setValue] = useState(query);

  useEffect(() => {
    setValue(query);
  }, [query]);

  // Debounce the search submission (only when value differs from query)
  useEffect(() => {
    if (value === query) return; // Skip if value matches the external query

    const timeoutId = setTimeout(() => {
      onSubmit(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [onSubmit, query, value]);

  return (
    <Box
      component="form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(value);
      }}
    >
      <TextField
        fullWidth
        label="Search resource"
        placeholder="Example: fish, fern, ore"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
}
