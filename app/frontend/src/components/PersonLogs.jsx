import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Box,
  TextField,
  InputAdornment,
  IconButton,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { appColors } from '../theme/colors';

const PersonLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = () => {
    const savedLogs = localStorage.getItem('detectionLogs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
      setFilteredLogs(JSON.parse(savedLogs));
    }
  };

  useEffect(() => {
    const filtered = logs.filter(log =>
      log.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const getStatusChip = (log) => {
    if (log.eventType === 'salida') {
      return <Chip icon={<PersonIcon />} label="Salida" color="default" size="small" />;
    }
    if (log.eventType === 'entrada') {
      if (log.status === 'reconocido') {
        return <Chip icon={<CheckCircleIcon />} label="Entrada reconocida" color="success" size="small" />;
      }
      return <Chip icon={<PersonIcon />} label="Entrada no reconocida" color="warning" size="small" />;
    }
    if (log.status === 'reconocido') {
      return <Chip icon={<CheckCircleIcon />} label="Reconocido" color="success" size="small" />;
    }
    return <Chip icon={<PersonIcon />} label="No reconocido" color="warning" size="small" />;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date(date));
  };

  const clearLogs = () => {
    if (window.confirm('¿Estás seguro de que quieres borrar todo el historial?')) {
      localStorage.removeItem('detectionLogs');
      setLogs([]);
      setFilteredLogs([]);
    }
  };

  const exportLogs = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `detection_logs_${new Date().toISOString()}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h5" gutterBottom>
            Historial de Detecciones
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportLogs}
              size="small"
            >
              Exportar
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={clearLogs}
              size="small"
            >
              Limpiar
            </Button>
          </Box>
        </Box>
        <Typography variant="body2" color="textSecondary" paragraph>
          Registro de todas las personas detectadas en el sistema
        </Typography>

        <TextField
          fullWidth
          variant="outlined"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        <TableContainer component={Paper} elevation={0} sx={{ border: `1px solid ${appColors.border}` }}>
          <Table>
            <TableHead sx={{ backgroundColor: appColors.background }}>
              <TableRow>
                <TableCell>Persona</TableCell>
                <TableCell>Fecha y Hora</TableCell>
                <TableCell>Estado</TableCell>
                <TableCell>Confianza</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ width: 40, height: 40 }}>
                        <PersonIcon />
                      </Avatar>
                      <Typography variant="body1">{log.name}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="body2">{formatDate(log.timestamp)}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{getStatusChip(log)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {log.confidence}%
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredLogs.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="textSecondary">
              No se encontraron registros
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PersonLogs;