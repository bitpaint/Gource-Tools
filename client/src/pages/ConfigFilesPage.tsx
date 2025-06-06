import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Paper,
  Box,
  Alert,
  TextField,
  CircularProgress,
  InputAdornment,
  Tooltip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import { 
  Add as AddIcon, 
  Edit as EditIcon, 
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import { renderProfilesApi, dateUtils, settingsApi } from '../api/api';
import { defaultSettings, settingsDescriptions } from '../../../shared/defaultGourceConfig';
import { convertFormToApiParams, convertApiToFormParams } from '../utils/gourceUtils';

// Import the dialog component
import GourceConfigEditorDialog from '../components/gource-config/GourceConfigEditorDialog';

// Define profile interface
interface GourceProfile {
  id: string | null;
  name: string;
  description: string;
  settings: Record<string, any>;
  isSystemProfile?: boolean;
  updatedAt?: string;
}

interface ApiErrorResponse {
  response?: {
    data?: {
      error?: string;
    }
  }
}

const ConfigFilesPage = () => {
  const [profiles, setProfiles] = useState<GourceProfile[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for default profile ID
  const [defaultProfileId, setDefaultProfileId] = useState<string | null>(null);

  // Profile dialog state
  const [openProfileDialog, setOpenProfileDialog] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentProfile, setCurrentProfile] = useState<GourceProfile>({
    id: null as unknown as string,
    name: '',
    description: '',
    settings: {
      ...convertApiToFormParams({ ...defaultSettings }),
      useUserImageDir: true,
      key: false,
      showDates: true,
      hideRoot: false,
      disableProgress: false,
      stopAtEnd: true,
      hide: ["progress", "mouse", "filenames", "root"],
      useRelativeStartDate: false,
      relativeStartDateValue: '',
      startDate: null,
      stopDate: null,
    }
  });
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  
  // Delete dialog state
  const [openDeleteDialog, setOpenDeleteDialog] = useState<boolean>(false);
  const [profileToDelete, setProfileToDelete] = useState<GourceProfile | null>(null);
  const [deletingProfile, setDeletingProfile] = useState<boolean>(false);

  // Load profiles and default setting on component mount
  useEffect(() => {
    fetchProfiles();
    fetchDefaultProfileId();
  }, []);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await renderProfilesApi.getAll();
      setProfiles(response.data);
    } catch (err) {
      console.error('Error fetching profiles:', err);
      setError('Failed to load config files. Please try again.');
      toast.error('Failed to load config files');
    } finally {
      setLoading(false);
    }
  };

  // Fetch the current default profile ID
  const fetchDefaultProfileId = async () => {
    try {
      const response = await settingsApi.getDefaultProfileId();
      setDefaultProfileId(response.data.defaultProjectProfileId);
    } catch (err) {
      console.error('Error fetching default profile ID:', err);
      toast.error('Failed to load default profile setting');
    }
  };

  // Profile handlers
  const handleOpenProfileDialog = (profile: GourceProfile | null = null) => {
    if (profile) {
      setIsEditing(true);
      // Convert API parameters to form format
      const formParams = convertApiToFormParams({ ...profile.settings });
      setCurrentProfile({
        id: profile.id,
        name: profile.name,
        description: profile.description || '',
        settings: formParams,
        isSystemProfile: profile.isSystemProfile,
        updatedAt: profile.updatedAt
      });
    } else {
      setIsEditing(false);
      // Initialize with the NEW desired defaults for user-created profiles
      const initialUserSettings = {
        ...convertApiToFormParams({ ...defaultSettings }),
        useUserImageDir: true,
        key: false,
        showDates: true,
        hideRoot: false,
        disableProgress: false,
        stopAtEnd: true,
        hide: ["progress", "mouse", "filenames", "root"],
        useRelativeStartDate: false,
        relativeStartDateValue: '',
        startDate: null,
        stopDate: null,
      };
      
      setCurrentProfile({
        id: null as unknown as string,
        name: '',
        description: '',
        settings: initialUserSettings
      });
    }
    setOpenProfileDialog(true);
  };

  const handleCloseProfileDialog = () => {
    setOpenProfileDialog(false);
  };

  const handleSaveProfile = async () => {
    if (!currentProfile.name) {
      toast.error('Profile name is required');
      return;
    }

    try {
      setSavingProfile(true);
      
      // Convert form parameters to API format
      const apiParams = convertFormToApiParams(currentProfile.settings);
      
      // Debug verification
      console.log('Original parameters:', currentProfile.settings);
      console.log('Converted parameters for API:', apiParams);
      
      // Use converted parameters
      const profileToSave = {
        ...currentProfile,
        settings: apiParams
      };
      
      if (isEditing) {
        // Update existing profile
        const response = await renderProfilesApi.update(profileToSave.id as string, profileToSave);
        
        // Update profiles array
        const updatedProfiles = profiles.map(profile => 
          profile.id === profileToSave.id ? response.data : profile
        );
        setProfiles(updatedProfiles);
        
        toast.success('Config file updated successfully');
      } else {
        // Create new profile
        const response = await renderProfilesApi.create(profileToSave);
        setProfiles([...profiles, response.data]);
        toast.success('Config file created successfully');
      }
      
      handleCloseProfileDialog();
    } catch (err: unknown) {
      console.error('Error saving profile:', err);
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr.response?.data?.error || 'Failed to save config file');
    } finally {
      setSavingProfile(false);
    }
  };

  // Delete profile handlers
  const handleOpenDeleteDialog = (profile: GourceProfile) => {
    setProfileToDelete(profile);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setProfileToDelete(null);
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete || !profileToDelete.id) return;
    
    try {
      setDeletingProfile(true);
      await renderProfilesApi.delete(profileToDelete.id as string);
      
      setProfiles(profiles.filter(profile => profile.id !== profileToDelete.id));
      toast.success('Config file deleted successfully');
      handleCloseDeleteDialog();
    } catch (err: unknown) {
      console.error('Error deleting profile:', err);
      
      // Specific error message for default profile
      const apiErr = err as ApiErrorResponse;
      if (apiErr.response?.data?.error === 'The default Gource config file cannot be deleted') {
        toast.error('The default Gource config file cannot be deleted');
      } else {
        toast.error('Failed to delete config file');
      }
    } finally {
      setDeletingProfile(false);
    }
  };

  // Handler for duplicating a profile
  const handleDuplicateProfile = async (profileToDuplicate: GourceProfile) => {
    const newProfileName = `${profileToDuplicate.name} (Copy)`;
    // Ensure the new profile isn't marked as a system profile
    const newProfileSettings = { ...profileToDuplicate.settings };

    const newProfile = {
      name: newProfileName,
      description: profileToDuplicate.description || '',
      settings: newProfileSettings, // Use the existing settings
      isSystemProfile: false // Duplicated profiles are always user profiles
    };

    try {
      setLoading(true); // Reuse loading state for visual feedback
      const response = await renderProfilesApi.create(newProfile);
      setProfiles([...profiles, response.data]);
      toast.success(`Profile "${profileToDuplicate.name}" duplicated successfully as "${newProfileName}"`);
    } catch (err: unknown) {
      console.error('Error duplicating profile:', err);
      const apiErr = err as ApiErrorResponse;
      toast.error(apiErr.response?.data?.error || 'Failed to duplicate config file');
    } finally {
      setLoading(false);
    }
  };

  // Handler for setting a profile as the default
  const handleSetDefaultProfile = async (profileId: string) => {
    // Optimistic update
    const previousDefaultId = defaultProfileId;
    setDefaultProfileId(profileId);

    try {
      await settingsApi.setDefaultProfileId(profileId);
      toast.success('Default project profile updated successfully');
    } catch (err) {
      // Revert on error
      setDefaultProfileId(previousDefaultId);
      console.error('Error setting default profile:', err);
      toast.error('Failed to set default profile');
    }
  };

  // Filtered profiles based on search query
  const filteredProfiles = profiles.filter(profile => 
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (profile.description && profile.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    return dateUtils.formatLocaleDate(new Date(dateString));
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // Utility function to display profile properties with dashes
  const getProfileSetting = (profile: GourceProfile, key: string) => {
    // For properties with dashes, use bracket notation
    if (key.includes('-')) {
      return profile.settings[key];
    }
    return profile.settings[key];
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Config Files
      </Typography>
      <Typography variant="subtitle1" gutterBottom>
        Create and manage Gource configuration files
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ my: 2 }}>
          {error}
        </Alert>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, mt: 3 }}>
        <TextField
          placeholder="Search config files..."
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: '350px' }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />} 
          onClick={() => handleOpenProfileDialog()}
        >
          Create Config File
        </Button>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Background Color</TableCell>
                <TableCell>Seconds per Day</TableCell>
                <TableCell>Last Modified</TableCell>
                <TableCell>Actions</TableCell>
                <TableCell>Default</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    No config files found
                  </TableCell>
                </TableRow>
              ) : (
                filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell>{profile.name}</TableCell>
                    <TableCell>
                      <Tooltip title={profile.description || ''} placement="top-start">
                        <Typography 
                          noWrap 
                          sx={{
                            maxWidth: '300px', // Adjust max-width as needed
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            display: 'block' // Ensure Typography behaves like a block element for ellipsis
                          }}
                        >
                          {profile.description || 'No description'}{profile.isSystemProfile && ' (System)'}
                        </Typography>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1 
                      }}>
                        <Box 
                          sx={{ 
                            width: 24, 
                            height: 24, 
                            bgcolor: profile.settings.background || '#000000',
                            borderRadius: '4px',
                            border: '1px solid rgba(224, 224, 224, 1)'
                          }} 
                        />
                        {profile.settings.background || '#000000'}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {/* Display 'auto' if speed is dynamic */} 
                      {(() => {
                        const spdSetting = getProfileSetting(profile, 'seconds-per-day');
                        const startDateSetting = profile.settings.startDate;
                        
                        // Check if SPD contains 'auto' or if start date is relative
                        if ((typeof spdSetting === 'string' && spdSetting.includes('auto')) ||
                            (typeof startDateSetting === 'string' && startDateSetting.startsWith('relative'))) {
                          return 'auto';
                        }
                        // Otherwise, return the numeric value or default to 1
                        return spdSetting || '1';
                      })()}
                    </TableCell>
                    <TableCell>{formatDate(profile.updatedAt)}</TableCell>
                    <TableCell>
                      {/* Edit Button */}
                      <Tooltip title={profile.isSystemProfile ? "System profiles cannot be edited" : "Edit profile"}>
                        <span> {/* Span needed for tooltip on disabled button */}
                          <IconButton 
                            color="primary" 
                            onClick={() => handleOpenProfileDialog(profile)}
                            disabled={profile.isSystemProfile}
                          >
                            <EditIcon />
                          </IconButton>
                        </span>
                      </Tooltip>

                      {/* Duplicate Button */}
                      <Tooltip title="Duplicate profile">
                         <IconButton color="default" onClick={() => handleDuplicateProfile(profile)}>
                           <ContentCopyIcon />
                         </IconButton>
                      </Tooltip>

                      {/* Delete Button - Show only one, disable for system profiles */}
                      <Tooltip title={profile.isSystemProfile ? "System profiles cannot be deleted" : "Delete profile"}>
                        <span> {/* Span needed for tooltip on disabled button */}
                          <IconButton 
                            color="error" 
                            onClick={() => handleOpenDeleteDialog(profile)} 
                            disabled={profile.isSystemProfile}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                    <TableCell align="center">
                      {profile.id === defaultProfileId ? (
                        <Tooltip title="This is the default profile for new projects.">
                          <CheckCircleIcon color="success" />
                        </Tooltip>
                      ) : (
                        <Tooltip title="Set as default profile for new projects">
                          <Button 
                            size="small" 
                            onClick={() => handleSetDefaultProfile(profile.id as string)}
                            startIcon={<CheckCircleIcon sx={{ color: 'action.disabled' }} />}
                          >
                            Set Default
                          </Button>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Config File Dialog - Using our new component */}
      <GourceConfigEditorDialog
        open={openProfileDialog} 
        onClose={handleCloseProfileDialog}
        onSave={handleSaveProfile}
        currentProfile={currentProfile}
        setCurrentProfile={setCurrentProfile}
        isEditing={isEditing}
        savingProfile={savingProfile}
        settingsDescriptions={settingsDescriptions}
      />

      {/* Delete Config File Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Gource Config File</DialogTitle>
        {profileToDelete?.isSystemProfile && (
          <DialogContentText sx={{ px: 3, color: 'error.main' }}>
            System profiles cannot be deleted.
          </DialogContentText>
        )}
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete the config file "{profileToDelete?.name}"?
            Any projects using this file will revert to default settings.
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} disabled={deletingProfile}>Cancel</Button>
          <Button 
            onClick={handleDeleteProfile} 
            color="error" 
            variant="contained" 
            disabled={deletingProfile || profileToDelete?.isSystemProfile}
            startIcon={deletingProfile && <CircularProgress size={16} color="inherit" />}
          >
            {deletingProfile ? 'Deleting...' : (profileToDelete?.isSystemProfile ? 'Cannot Delete' : 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ConfigFilesPage; 