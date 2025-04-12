import React from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Divider
} from '@mui/material';
import { 
  Folder as FolderIcon,
  YouTube as YouTubeIcon,
  Twitter as TwitterIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { rendersApi } from '../api/api';

const ExportsPage = () => {
  const handleOpenExportsFolder = async () => {
    try {
      await rendersApi.openExportsFolder();
    } catch (err) {
      console.error('Error opening exports folder:', err);
      toast.error('Failed to open exports folder');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Exports
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Manage and publish your rendered Gource videos
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h6" gutterBottom>
              Access Your Rendered Videos
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              All rendered videos are stored locally in the exports folder.
              Open the folder to access, manage or publish your videos.
            </Typography>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: 'right' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<FolderIcon />}
              onClick={handleOpenExportsFolder}
              size="large"
            >
              Open Exports Folder
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Typography variant="h5" gutterBottom sx={{ mt: 6, mb: 3 }}>
        Publishing Options
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="https://www.edigitalagency.com.au/wp-content/uploads/Youtube-logo-png.png"
              alt="YouTube"
              sx={{ objectFit: 'contain', bgcolor: '#282828', p: 2 }}
            />
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Publish to YouTube
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Share your Gource visualizations with the world by uploading directly to YouTube.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                Coming soon: Direct YouTube integration will allow you to upload videos directly from the app.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                For now, you can:
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<YouTubeIcon />}
                fullWidth
                href="https://studio.youtube.com/channel/upload"
                target="_blank"
                sx={{ mb: 1 }}
              >
                Go to YouTube Studio
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<FolderIcon />}
                fullWidth
                onClick={handleOpenExportsFolder}
              >
                Access Videos
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardMedia
              component="img"
              height="140"
              image="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Logo_of_Twitter.svg/2491px-Logo_of_Twitter.svg.png"
              alt="X (Twitter)"
              sx={{ objectFit: 'contain', bgcolor: '#282828', p: 2 }}
            />
            <CardContent>
              <Typography variant="h6" component="div" gutterBottom>
                Share on X (Twitter)
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Show off your repository visualizations on X (formerly Twitter) to engage with the developer community.
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontStyle: 'italic' }}>
                Coming soon: Direct X integration for posting videos with customized messages.
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                For now, you can:
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                startIcon={<TwitterIcon />}
                fullWidth
                href="https://twitter.com/compose/tweet"
                target="_blank"
                sx={{ mb: 1 }}
              >
                Compose Post on X
              </Button>
              <Button 
                variant="outlined" 
                startIcon={<FileDownloadIcon />}
                fullWidth
                onClick={handleOpenExportsFolder}
              >
                Access Videos
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mt: 8, mb: 4, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Gource Tools is a local application and does not store your videos in the cloud.
          All rendered videos remain on your local machine.
        </Typography>
      </Box>
    </Container>
  );
};

export default ExportsPage; 