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
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import AddAPhotoIcon from '@mui/icons-material/AddAPhoto';
import { styled } from '@mui/material/styles';

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

const AddPersonForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
  });
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !image) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos y añade una imagen' });
      return;
    }

    setLoading(true);
    
    // Simulación de envío
    setTimeout(() => {
      console.log('Datos de persona:', {
        ...formData,
        image: image,
      });
      
      setMessage({ type: 'success', text: `Persona "${formData.name}" añadida correctamente` });
      setFormData({ name: '', email: '', role: '' });
      setImage(null);
      setImagePreview(null);
      setLoading(false);
      
      setTimeout(() => setMessage(null), 3000);
    }, 2000);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Añadir Nueva Persona
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Completa el formulario para registrar una nueva persona en el sistema de reconocimiento facial
        </Typography>

        {message && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Avatar
                  src={imagePreview}
                  sx={{
                    width: 200,
                    height: 200,
                    mb: 2,
                    border: '3px solid #1976d2',
                  }}
                >
                  {!imagePreview && <AddAPhotoIcon sx={{ fontSize: 60 }} />}
                </Avatar>
                
                <Button
                  component="label"
                  variant="outlined"
                  startIcon={<PhotoCameraIcon />}
                  sx={{ mt: 2 }}
                >
                  Subir/Añadir Imagen
                  <VisuallyHiddenInput
                    type="file"
                    accept="image/*"
                    onChange={handleImageCapture}
                  />
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                fullWidth
                label="Nombre completo"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                sx={{ mb: 2 }}
              />
              
              <TextField
                fullWidth
                label="Rol / Departamento"
                name="role"
                value={formData.role}
                onChange={handleChange}
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  type="submit"
                  disabled={loading}
                  size="large"
                >
                  {loading ? 'Guardando...' : 'Guardar Persona'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </CardContent>
    </Card>
  );
};

export default AddPersonForm;