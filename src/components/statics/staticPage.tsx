// import { AspectRatio, Box, Card, CardContent, Stack } from "@mui/joy";
import { AspectRatio } from "@mui/icons-material";
import { Box, Card, CardContent, Stack } from "@mui/material";
import { memo, ReactNode } from "react";

interface StaticPageProps {
  children: ReactNode;
}

const StaticPage = memo(({ children }: StaticPageProps) => (
  <Box
    sx={{
      position: "fixed",
      inset: 0,
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}
  >
    <Card
      // variant="plain"
      sx={{
        width: "90%",
        maxWidth: "100%"
      }}
    >
      <AspectRatio
        // color="neutral"
        // variant="plain"
        // ratio="1"
        sx={{
          width: 90,
          margin: "auto"
        }}
      >
        <img src="/android-chrome-192x192.png" alt="" />
      </AspectRatio>
      <CardContent>
        <Stack spacing={2} sx={{ alignItems: "center", textAlign: "center" }}>
          {children}
        </Stack>
      </CardContent>
    </Card>
  </Box>
));

export default StaticPage;
