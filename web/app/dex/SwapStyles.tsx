import { Box, Button, Input, IconButton, chakra } from "@chakra-ui/react";

export const PageBackground = chakra(Box, {
  baseStyle: {
    bg: "#0A0E17", 
    minH: "100vh",
    color: "white",
    p: { base: 4, md: 8 },
  },
});

export const Card = chakra(Box, {
  baseStyle: {
    bg: "#141A26", 
    p: 8,
    borderRadius: "2xl",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)", 
    border: "1px solid",
    borderColor: "#1E2636",
    color: "white",
  },
});

export const TokenInputContainer = chakra(Box, {
  baseStyle: {
    width: "100%",
    bg: "#1C2533", 
    p: 6,
    borderRadius: "xl",
    border: "1px solid",
    borderColor: "#1E2636",
  },
});

export const TokenButton = chakra(Button, {
  baseStyle: {
    bg: "#2E3A4A", 
    borderRadius: "full",
    px: 4,
    py: 3,
    fontWeight: "bold",
    color: "white",
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)", 
    _hover: { bg: "#3B4A61" }, 
  },
});

export const AmountInput = chakra(Input, {
  baseStyle: {
    bg: "#2E3A4A",
    color: "white",
    flex: 1,
    borderRadius: "full",
    border: "none",
    textAlign: "right",
    fontSize: "lg",
    fontWeight: "bold",
    _placeholder: { color: "gray.500" },
    _focus: { bg: "#3B4A61", border: "1px solid", borderColor: "#1E2636" },
  },
});

export const SwapActionButton = chakra(Button, {
  baseStyle: {
    background: "linear-gradient(to right, #13B0F5, #29A3E8)", 
    color: "white",
    width: "full",
    mt: 6,
    py: 6,
    _hover: { background: "linear-gradient(to right, #0FA9DC, #218ACB)" }, 
    borderRadius: "full",
    fontSize: "xl",
    fontWeight: "bold",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.2)", 
  },
});

export const SwapToggleButton = chakra(IconButton, {
  baseStyle: {
    size: "lg",
    isRound: true,
    bg: "#2E3A4A",
    color: "white",
    border: "2px solid",
    borderColor: "#1E2636",
    _hover: { bg: "#3B4A61" },
    boxShadow: "0 2px 10px rgba(0, 0, 0, 0.15)", 
    mt: -4,
    mb: -4,
    zIndex: 1,
  },
});
