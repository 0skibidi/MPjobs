import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Grid,
  TextField,
  Button,
  MenuItem,
  Chip,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  CircularProgress,
  Alert
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { Editor } from '@tinymce/tinymce-react';
import { Autocomplete } from '@mui/material';
import { JobFormData } from '../../types/job';
import { JobType } from '../../types/enums';
import { createJob, resetJobState } from '../../store/slices/jobSlice';
import { RootState } from '../../store';
import { commonSkills } from '../../utils/constants';

const initialFormData: JobFormData = {
  title: '',
  description: '',
  requirements: [],
  location: {
    city: '',
    state: '',
    country: '',
    remote: false
  },
  salaryRange: {
    min: 0,
    max: 0,
    currency: 'USD'
  },
  jobType: JobType.FULL_TIME,
  applicationDeadline: '',
  skills: []
};

export const JobPostingForm: React.FC = () => {
  const dispatch = useDispatch();
  const { loading, error, success } = useSelector((state: RootState) => state.jobs);
  const [previewMode, setPreviewMode] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors }
  } = useForm<JobFormData>({
    defaultValues: initialFormData
  });

  const formValues = watch();

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    await dispatch(createJob(data));
  };

  const togglePreview = () => {
    setPreviewMode(!previewMode);
  };

  React.useEffect(() => {
    if (success) {
      reset(initialFormData);
      setLogoPreview(null);
      dispatch(resetJobState());
    }
  }, [success, dispatch, reset]);

  if (previewMode) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h5">Preview</Typography>
          <Button onClick={togglePreview}>Edit</Button>
        </Box>
        {logoPreview && (
          <Box sx={{ mb: 2 }}>
            <img src={logoPreview} alt="Company logo" style={{ maxHeight: 100 }} />
          </Box>
        )}
        <Typography variant="h6">{formValues.title}</Typography>
        <Box sx={{ my: 2 }}>
          <div dangerouslySetInnerHTML={{ __html: formValues.description }} />
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Requirements:</Typography>
            <ul>
              {formValues.requirements.map((req, index) => (
                <li key={index}>{req}</li>
              ))}
            </ul>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1">Skills:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {formValues.skills.map((skill) => (
                <Chip key={skill} label={skill} />
              ))}
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              component="label"
              sx={{ mb: 2 }}
            >
              Upload Logo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleLogoChange}
              />
            </Button>
            {logoPreview && (
              <Box sx={{ mt: 2 }}>
                <img src={logoPreview} alt="Preview" style={{ maxHeight: 100 }} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="title"
              control={control}
              rules={{ required: 'Job title is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Job Title"
                  fullWidth
                  error={!!errors.title}
                  helperText={errors.title?.message}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="description"
              control={control}
              rules={{ required: 'Description is required' }}
              render={({ field: { onChange, value } }) => (
                <Editor
                  apiKey="your-tinymce-api-key"
                  init={{
                    height: 300,
                    menubar: false,
                    plugins: [
                      'advlist autolink lists link image charmap print preview anchor',
                      'searchreplace visualblocks code fullscreen',
                      'insertdatetime media table paste code help wordcount'
                    ],
                    toolbar:
                      'undo redo | formatselect | bold italic backcolor | \
                      alignleft aligncenter alignright alignjustify | \
                      bullist numlist outdent indent | removeformat | help'
                  }}
                  value={value}
                  onEditorChange={onChange}
                />
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="jobType"
              control={control}
              rules={{ required: 'Job type is required' }}
              render={({ field }) => (
                <TextField
                  {...field}
                  select
                  label="Job Type"
                  fullWidth
                  error={!!errors.jobType}
                  helperText={errors.jobType?.message}
                >
                  {Object.values(JobType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Controller
              name="applicationDeadline"
              control={control}
              rules={{ required: 'Application deadline is required' }}
              render={({ field }) => (
                <DatePicker
                  label="Application Deadline"
                  value={field.value}
                  onChange={field.onChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      error: !!errors.applicationDeadline,
                      helperText: errors.applicationDeadline?.message
                    }
                  }}
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Controller
              name="skills"
              control={control}
              rules={{ required: 'At least one skill is required' }}
              render={({ field: { onChange, value } }) => (
                <Autocomplete
                  multiple
                  options={commonSkills}
                  value={value}
                  onChange={(_, newValue) => onChange(newValue)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Skills"
                      error={!!errors.skills}
                      helperText={errors.skills?.message}
                    />
                  )}
                  renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => (
                      <Chip
                        label={option}
                        {...getTagProps({ index })}
                      />
                    ))
                  }
                />
              )}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={togglePreview}
                disabled={loading}
              >
                Preview
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                Post Job
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </form>
  );
}; 