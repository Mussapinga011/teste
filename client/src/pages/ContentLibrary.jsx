import React, { useState, useEffect } from 'react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Modal,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '80%',
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const ContentLibrary = () => {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedContent, setSelectedContent] = useState(null);
  const [open, setOpen] = useState(false);
  const [filters, setFilters] = useState({ disciplina: 'all', tipo: 'all' });

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      setError(null);
      try {
        let contentQuery = query(collection(db, 'contents'));

        if (filters.disciplina !== 'all') {
            contentQuery = query(contentQuery, where('disciplina', '==', filters.disciplina));
        }

        if (filters.tipo !== 'all') {
            contentQuery = query(contentQuery, where('tipo', '==', filters.tipo));
        }

        const querySnapshot = await getDocs(contentQuery);
        const contentList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setContent(contentList);
      } catch (err) {
        setError('Failed to fetch content.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [filters]);

  const handleOpen = (content) => {
    setSelectedContent(content);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedContent(null);
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Content Library
        </Typography>

        <Box sx={{ mb: 4 }}>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel>Discipline</InputLabel>
            <Select
              value={filters.disciplina}
              onChange={handleFilterChange}
              name="disciplina"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="Math">Math</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="History">History</MenuItem>
            </Select>
          </FormControl>
          <FormControl sx={{ m: 1, minWidth: 120 }}>
            <InputLabel>Type</InputLabel>
            <Select
              value={filters.tipo}
              onChange={handleFilterChange}
              name="tipo"
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="exercicio">Exercise</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <CircularProgress />
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <Grid container spacing={4}>
            {content.map((item) => (
              <Grid item key={item.id} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography gutterBottom variant="h5" component="div">
                      {item.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.disciplina} - {item.tipo}
                    </Typography>
                  </CardContent>
                  <CardActions>
                    <Button size="small" onClick={() => handleOpen(item)}>View</Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          {selectedContent && (
            <>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                {selectedContent.title}
              </Typography>
              <Box id="modal-modal-description" sx={{ mt: 2 }}>
                {selectedContent.tipo === 'pdf' && (
                  <iframe src={selectedContent.arquivoURL} width="100%" height="500px" title={selectedContent.title}></iframe>
                )}
                {selectedContent.tipo === 'video' && (
                  <video src={selectedContent.arquivoURL} width="100%" controls title={selectedContent.title}></video>
                )}
                 {selectedContent.tipo === 'exercicio' && (
                  <Typography>This is an exercise. Please go to the quiz section.</Typography>
                )}
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Container>
  );
};

export default ContentLibrary;
