import {
  Card, CardContent, CardActions,
  Box, Skeleton,
} from "@mui/material";

export default function SkeletonCard() {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
          <Skeleton width="60%" height={22} />
          <Skeleton width={60} height={22} />
        </Box>
        <Skeleton width="100%" />
        <Skeleton width="85%" />
        <Skeleton width="70%" />
      </CardContent>
      <CardActions sx={{ px: 2, py: 1, justifyContent: "space-between" }}>
        <Skeleton width={80} height={30} />
        <Skeleton variant="circular" width={28} height={28} />
      </CardActions>
    </Card>
  );
}
