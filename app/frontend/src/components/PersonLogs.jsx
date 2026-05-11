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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

// Datos de ejemplo
const generateSampleLogs = () => {
  const names = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Pérez', 'Laura Martínez'];
  const statuses = ['reconocido', 'no reconocido'];
  
  return Array.from({ length: 15 }, (_, i) => ({
    id: i + 1,
    name: names[Math.floor(Math.random() * names.length)],
    timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    status: statuses[Math.floor(Math.random() * statuses.length)],
    confidence: Math.floor(Math.random() * 30) + 70,
  }));
};

const PersonLogs = () => {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLogs, setFilteredLogs] = useState([]);

  useEffect(() => {
    const sampleLogs = generateSampleLogs();
    setLogs(sampleLogs);
    setFilteredLogs(sampleLogs);
  }, []);

  useEffect(() => {
    const filtered = logs.filter(log =>
      log.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  }, [searchTerm, logs]);

  const getStatusChip = (status) => {
    if (status === 'reconocido') {
      return <Chip icon={<CheckCircleIcon />} label="Reconocido" color="success" size="small" />;
    }
    return <Chip icon={<PersonIcon />} label="No reconocido" color="warning" size="small" />;
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(date);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" gutterBottom>
          Historial de Detecciones
        </Typography>
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

        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
          <Table>
            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
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
                  <TableCell>{getStatusChip(log.status)}</TableCell>
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