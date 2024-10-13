// Swap.tsx
"use client";
import {
    Box,
    VStack,
    HStack,
    Text,
    Button,
    Input,
    Divider,
    Image,
    IconButton,
  } from "@chakra-ui/react";
import { useState } from "react";
import { FaExchangeAlt, FaChevronDown } from "react-icons/fa";
import {
  Card,
  TokenInputContainer,
  TokenButton,
  AmountInput,
  SwapActionButton,
} from "./SwapStyles";

const tokenOptions = [
  { value: "SOL", label: "SOL", icon: "/path/to/sol-icon.png" },
  { value: "FLOCKA", label: "FLOCKA", icon: "/path/to/flocka-icon.png" },
];

const Swap = () => {
  const [fromToken, setFromToken] = useState("SOL");
  const [toToken, setToToken] = useState("FLOCKA");

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  return (
    <VStack
      justify="center"
      align="center"
      spacing={{ base: "8", md: "8" }}
      bg="gray.50"
      color="black"
      p={{ base: "4", md: "8" }}
      minH="100vh"
    >
      <HStack
        spacing={{ base: "0", md: "8" }}
        width="full"
        maxW="1200px"
        flexWrap={{ base: "wrap", md: "nowrap" }}
        justify="center"
        align="flex-start"
      >
        <Card width={{ base: "100%", md: "600px" }} mb={{ base: "8", md: "0" }}>
          <Text fontSize="lg" color="gray.600" mb="4">
            {fromToken} / {toToken}
          </Text>
          <Text fontSize="3xl" fontWeight="bold" color="teal.500" mb="6">
            0.000002
          </Text>
          <Box
            mt="4"
            h="400px"
            bg="gray.100"
            borderRadius="xl"
            p="4"
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            <Text color="gray.400">Chart Area</Text>
          </Box>
        </Card>

        <Card width={{ base: "100%", md: "400px" }}>
          <Text fontSize="2xl" fontWeight="bold" mb="6">
            Swap
          </Text>
          <VStack spacing="6">
            <TokenInputContainer mb="2">
              <Text fontSize="sm" color="gray.500" mb="2">
                From
              </Text>
              <HStack>
                <TokenButton onClick={() => {}}>
                  <Image
                    src={
                      tokenOptions.find(
                        (option) => option.value === fromToken
                      )?.icon
                    }
                    boxSize="24px"
                    alt={fromToken}
                    mr="2"
                  />
                  {fromToken}
                  <FaChevronDown style={{ marginLeft: "auto" }} />
                </TokenButton>
                <AmountInput placeholder="0.0" />
              </HStack>
            </TokenInputContainer>

            <IconButton
              aria-label="Swap Tokens"
              icon={<FaExchangeAlt />}
              onClick={handleSwapTokens}
              size="lg"
              isRound
              bg="white"
              color="gray.500"
              border="1px solid"
              borderColor="gray.300"
              _hover={{ bg: "gray.100" }}
            />

            <TokenInputContainer mt="2">
              <Text fontSize="sm" color="gray.500" mb="2">
                To
              </Text>
              <HStack>
                <TokenButton onClick={() => {}}>
                  <Image
                    src={
                      tokenOptions.find(
                        (option) => option.value === toToken
                      )?.icon
                    }
                    boxSize="24px"
                    alt={toToken}
                    mr="2"
                  />
                  {toToken}
                  <FaChevronDown style={{ marginLeft: "auto" }} />
                </TokenButton>
                <AmountInput placeholder="0.0" />
              </HStack>
            </TokenInputContainer>

            <SwapActionButton>Swap</SwapActionButton>
          </VStack>
        </Card>
      </HStack>
    </VStack>
  );
};

export default Swap;
