import Box from "@mui/material/Box"
import Card from "@mui/material/Card"
import CardContent from "@mui/material/CardContent"
import Typography from "@mui/material/Typography"
import Divider from "@mui/material/Divider"

export default function UltraDashboard() {
  return (
    <Box component="section" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
        Overview
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Balance
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              $24,820
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              P/L (24h)
            </Typography>
            <Typography variant="h5" fontWeight={700} color="success.main">
              +3.2%
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Open Positions
            </Typography>
            <Typography variant="h5" fontWeight={700}>
              4
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Status
            </Typography>
            <Typography variant="h6" fontWeight={600}>
              Stable
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
        }}
      >
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Activity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No external API imports used here.
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>
              Notes
            </Typography>
            <Typography variant="body2" color="text.secondary">
              This dashboard uses MUI Box + CSS Grid to avoid Grid v1/v2 mismatches.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
