import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Paper,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import FaceIcon from '@mui/icons-material/Face';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import axios from 'axios';
import { appColors, appGradients } from '../theme/colors';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const RegisteredPersons = () => {
  const [persons, setPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPerson, setEditingPerson] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    loadPersons();
  }, []);

  const loadPersons = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/known_persons`);
      setPersons(response.data);
    } catch (error) {
      console.error('Error loading persons:', error);
      setMessage({ type: 'error', text: 'Error al cargar las personas registradas' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (person) => {
    setEditingPerson({ ...person });
    setOpenDialog(true);
  };

  const handleUpdate = async () => {
    if (!editingPerson) return;
    
    try {
      const response = await axios.put(`${API_URL}/api/known_persons/${editingPerson.id}`, {
        name: editingPerson.name,
        surname: editingPerson.surname,
        person_metadata: editingPerson.person_metadata
      });
      
      if (response.data) {
        setMessage({ type: 'success', text: 'Persona actualizada correctamente' });
        loadPersons();
        setOpenDialog(false);
        setEditingPerson(null);
      }
    } catch (error) {
      console.error('Error updating person:', error);
      setMessage({ type: 'error', text: 'Error al actualizar la persona' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDelete = async (personId) => {
    try {
      await axios.delete(`${API_URL}/api/known_persons/${personId}`);
      setMessage({ type: 'success', text: 'Persona eliminada correctamente' });
      loadPersons();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting person:', error);
      setMessage({ type: 'error', text: 'Error al eliminar la persona' });
    } finally {
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getInitials = (name, surname) => {
    return `${name.charAt(0)}${surname.charAt(0)}`.toUpperCase();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Mensajes de alerta */}
      {message && (
        <Alert severity={message.type} sx={{ mb: 3, position: 'fixed', top: 80, right: 20, zIndex: 9999 }}>
          {message.text}
        </Alert>
      )}

      {/* Estadísticas */}
      <Card sx={{ mb: 4, background: appGradients.primary, color: appColors.white }}>
        <CardContent>
          <Typography variant="h4" gutterBottom fontWeight="bold">
            Personas Registradas
          </Typography>
          <Typography variant="h2" fontWeight="bold">
            {persons.length}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {persons.length === 1 ? 'persona en el sistema' : 'personas en el sistema'}
          </Typography>
        </CardContent>
      </Card>

      {/* Grid de personas */}
      <Grid container spacing={3}>
        {persons.map((person) => (
          <Grid item xs={12} sm={6} md={4} key={person.id}>
            <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Avatar
                    sx={{
                      width: 60,
                      height: 60,
                      bgcolor: appColors.primary,
                      fontSize: '1.5rem'
                    }}
                  >
                    {getInitials(person.name, person.surname)}
                  </Avatar>
                  <Box>
                    <IconButton onClick={() => handleEdit(person)} color="primary" size="small">
                      <EditIcon />
                    </IconButton>
                    <IconButton onClick={() => setDeleteConfirm(person)} color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Typography variant="h6" fontWeight="bold">
                  {person.name} {person.surname}
                </Typography>

                {person.person_metadata && (
                  <Box sx={{ mt: 2 }}>
                    {person.person_metadata.email && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {person.person_metadata.email}
                        </Typography>
                      </Box>
                    )}
                    
                    {person.person_metadata.role && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <WorkIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="textSecondary">
                          {person.person_metadata.role}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${appColors.border}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CalendarTodayIcon fontSize="small" color="action" />
                    <Typography variant="caption" color="textSecondary">
                      Registrado: {formatDate(person.registered_at)}
                    </Typography>
                  </Box>
                </Box>

                <Chip
                  icon={<FaceIcon />}
                  label={`ID: ${person.id}`}
                  size="small"
                  variant="outlined"
                  sx={{ mt: 2 }}
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {persons.length === 0 && !loading && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h5" color="textSecondary" gutterBottom>
            No hay personas registradas
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Ve a "Añadir Persona" para comenzar a registrar personas en el sistema
          </Typography>
        </Box>
      )}

      {/* Diálogo de edición */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Editar Persona</DialogTitle>
        <DialogContent>
          {editingPerson && (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Nombre"
                value={editingPerson.name}
                onChange={(e) => setEditingPerson({ ...editingPerson, name: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Apellido"
                value={editingPerson.surname}
                onChange={(e) => setEditingPerson({ ...editingPerson, surname: e.target.value })}
                sx={{ mb: 2 }}
              />
              {editingPerson.person_metadata && (
                <>
                  <TextField
                    fullWidth
                    label="Email"
                    value={editingPerson.person_metadata.email || ''}
                    onChange={(e) => setEditingPerson({
                      ...editingPerson,
                      person_metadata: { ...editingPerson.person_metadata, email: e.target.value }
                    })}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Rol"
                    value={editingPerson.person_metadata.role || ''}
                    onChange={(e) => setEditingPerson({
                      ...editingPerson,
                      person_metadata: { ...editingPerson.person_metadata, role: e.target.value }
                    })}
                  />
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancelar</Button>
          <Button onClick={handleUpdate} variant="contained" color="primary">
            Guardar Cambios
          </Button>
        </DialogActions>
      </Dialog>

      {/* Diálogo de confirmación de eliminación */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirmar Eliminación</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Estás seguro de que deseas eliminar a {deleteConfirm?.name} {deleteConfirm?.surname}?
            Esta acción no se puede deshacer.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancelar</Button>
          <Button onClick={() => handleDelete(deleteConfirm.id)} variant="contained" color="error">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RegisteredPersons;