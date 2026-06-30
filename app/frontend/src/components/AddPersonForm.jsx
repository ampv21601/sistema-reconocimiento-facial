// app/frontend/src/components/AddPersonForm.jsx
import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Avatar,
  Alert,
  Grid,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { styled } from '@mui/material/styles';
import axios from 'axios';
import { appColors } from '../theme/colors';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AddPersonForm = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    role: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

  const steps = ['Datos personales', 'Foto', 'Confirmación'];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageCapture = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setMessage({ type: 'success', text: 'Imagen cargada correctamente' });
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: 'Por favor, selecciona una imagen válida' });
    }
  };

  const handleNext = () => {
    if (activeStep === 0 && (!formData.name || !formData.surname)) {
      setMessage({ type: 'error', text: 'Por favor, completa nombre y apellido' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    if (activeStep === 1 && !image) {
      setMessage({ type: 'error', text: 'Por favor, añade una foto' });
      setTimeout(() => setMessage(null), 3000);
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.surname || !image) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos y añade una imagen' });
      return;
    }

    setLoading(true);
    
    const formDataToSend = new FormData();
    formDataToSend.append('name', formData.name);
    formDataToSend.append('surname', formData.surname);
    formDataToSend.append('email', formData.email);
    formDataToSend.append('role', formData.role);
    formDataToSend.append('image', image);
    
    try {
      const response = await axios.post(`${API_URL}/api/add-person`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 30000,
      });
      
      if (response.data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${formData.name} ${formData.surname} añadido correctamente al sistema` 
        });
        
        // Reset form
        setFormData({ name: '', surname: '', email: '', role: '' });
        setImage(null);
        setImagePreview(null);
        setActiveStep(0);
        
        // Opcional: limpiar el input file
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
        
      } else {
        setMessage({ type: 'error', text: response.data.error || 'Error al guardar la persona' });
      }
    } catch (error) {
      console.error('Error detallado:', error);
      
      // Verificar si el error es de red o del servidor
      if (error.code === 'ERR_NETWORK') {
        setMessage({ type: 'error', text: 'Error de conexión con el servidor. ¿El backend está corriendo?' });
      } else if (error.response) {
        // El servidor respondió con un error
        const errorMsg = error.response.data?.detail || error.response.data?.message || 'Error del servidor';
        setMessage({ type: 'error', text: `Error del servidor: ${errorMsg}` });
        
        // Si el error es 400 pero la persona se creó, mostrar mensaje diferente
        if (error.response.status === 400 && error.response.data?.detail?.includes('already exists')) {
          setMessage({ type: 'warning', text: 'Esta persona ya existe en el sistema' });
        }
      } else if (error.request) {
        setMessage({ type: 'error', text: 'No se recibió respuesta del servidor' });
      } else {
        setMessage({ type: 'error', text: `Error: ${error.message}` });
      }
    } finally {
      setLoading(false);
      // Limpiar mensaje después de 5 segundos
      setTimeout(() => setMessage(null), 5000);
    }
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Nombre"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Apellido"
                name="surname"
                value={formData.surname}
                onChange={handleChange}
                required
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Rol / Departamento"
                name="role"
                value={formData.role}
                onChange={handleChange}
                variant="outlined"
              />
            </Grid>
          </Grid>
        );
      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4 }}>
            <Avatar
              src={imagePreview}
              sx={{
                width: 250,
                height: 250,
                mb: 3,
                border: `3px solid ${appColors.accentBlue}`,
              }}
            >
              {!imagePreview && <AddAPhotoIcon sx={{ fontSize: 80 }} />}
            </Avatar>
            
            <Button
              component="label"
              variant="contained"
              startIcon={<PhotoCameraIcon />}
              sx={{ mt: 2 }}
            >
              {imagePreview ? 'Cambiar foto' : 'Seleccionar foto'}
              <VisuallyHiddenInput
                type="file"
                accept="image/*"
                onChange={handleImageCapture}
              />
            </Button>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 2, textAlign: 'center' }}>
              La foto debe mostrar claramente el rostro de la persona<br />
              Formatos soportados: JPG, PNG
            </Typography>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ py: 4 }}>
            <Typography variant="h6" gutterBottom>Confirmar datos</Typography>
            <Card variant="outlined" sx={{ p: 3, mb: 3 }}>
              <Typography><strong>Nombre:</strong> {formData.name} {formData.surname}</Typography>
              {formData.email && <Typography><strong>Email:</strong> {formData.email}</Typography>}
              {formData.role && <Typography><strong>Rol:</strong> {formData.role}</Typography>}
              <Typography><strong>Foto:</strong> {imagePreview ? '✓ Imagen cargada' : '✗ Sin imagen'}</Typography>
            </Card>
            <Alert severity="info">
              Al confirmar, el sistema procesará la imagen y extraerá las características faciales para el reconocimiento.
            </Alert>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Añadir Nueva Persona
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Registra una nueva persona en el sistema de reconocimiento facial
        </Typography>

        {message && (
          <Alert 
            severity={message.type} 
            sx={{ mb: 3 }} 
            onClose={() => setMessage(null)}
            action={
              message.type === 'success' && (
                <Button color="inherit" size="small" onClick={() => window.location.href = '/registered-persons'}>
                  Ver personas
                </Button>
              )
            }
          >
            {message.text}
          </Alert>
        )}

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <form>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4, gap: 2 }}>
            {activeStep !== 0 && (
              <Button onClick={handleBack} disabled={loading}>
                Atrás
              </Button>
            )}
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                onClick={handleSubmit}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircleIcon />}
              >
                {loading ? 'Guardando...' : 'Confirmar y Guardar'}
              </Button>
            ) : (
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={loading}
              >
                Siguiente
              </Button>
            )}
          </Box>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPersonForm;