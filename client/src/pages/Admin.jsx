import React, { useState, useEffect } from 'react';
import { db, storage } from '../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  Container, Typography, Box, Button, TextField, Select, MenuItem, FormControl, InputLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, CircularProgress,
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';

const functions = getFunctions();

const Admin = () => {
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentContent, setCurrentContent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    disciplina: '',
    tipo: '',
    questoes: [],
  });
  const [file, setFile] = useState(null);

  const fetchContents = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, 'contents'));
    const contentsList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setContents(contentsList);
    setLoading(false);
  };

  useEffect(() => {
    fetchContents();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...formData.questoes];
    newQuestions[index][field] = value;
    if (field === 'opcoes') {
      newQuestions[index][field] = value.split(',').map(s => s.trim());
    }
    setFormData(prev => ({ ...prev, questoes: newQuestions }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questoes: [...prev.questoes, { pergunta: '', opcoes: [], respostaCorreta: '', explicacao: '' }],
    }));
  };

  const removeQuestion = (index) => {
    const newQuestions = formData.questoes.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, questoes: newQuestions }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    let arquivoURL = currentContent?.arquivoURL || '';

    if (file) {
      const storageRef = ref(storage, `contents/${file.name}`);
      await uploadBytes(storageRef, file);
      arquivoURL = await getDownloadURL(storageRef);
    }

    const dataToSave = { ...formData, arquivoURL };
    if (formData.tipo !== 'exercicio') {
      delete dataToSave.questoes;
    } else {
      delete dataToSave.arquivoURL;
    }

    try {
      if (currentContent) {
        const updateContent = httpsCallable(functions, 'content-updateContent');
        await updateContent({ id: currentContent.id, ...dataToSave });
      } else {
        const createContent = httpsCallable(functions, 'content-createContent');
        await createContent(dataToSave);
      }
    } catch (error) {
      console.error("Error saving content: ", error);
    }

    resetForm();
    fetchContents();
  };

  const handleEdit = (content) => {
    setCurrentContent(content);
    setFormData({
      title: content.title,
      disciplina: content.disciplina,
      tipo: content.tipo,
      questoes: content.questoes || [],
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      const deleteContent = httpsCallable(functions, 'content-deleteContent');
      await deleteContent({ id });
      fetchContents();
    } catch (error) {
      console.error("Error deleting content: ", error);
    }
  };

  const resetForm = () => {
    setIsFormOpen(false);
    setCurrentContent(null);
    setFormData({ title: '', disciplina: '', tipo: '', questoes: [] });
    setFile(null);
  };

  const [adminEmail, setAdminEmail] = useState('');

  const handleMakeAdmin = async (e) => {
    e.preventDefault();
    try {
      const setAdminRole = httpsCallable(functions, 'users-setAdminRole');
      const result = await setAdminRole({ email: adminEmail });
      console.log(result.data.message);
      setAdminEmail('');
    } catch (error) {
      console.error("Error making user admin: ", error);
    }
  };

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" sx={{ my: 4 }}>Admin Panel</Typography>

      <Paper component="form" onSubmit={handleMakeAdmin} sx={{ p: 2, my: 2 }}>
        <Typography variant="h6">Make Admin</Typography>
        <TextField
          label="User Email"
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          fullWidth
          margin="normal"
          required
        />
        <Button type="submit" variant="contained">Make Admin</Button>
      </Paper>

      {!isFormOpen && <Button variant="contained" startIcon={<Add />} onClick={() => setIsFormOpen(true)}>Add New Content</Button>}

      {isFormOpen && (
        <Paper component="form" onSubmit={handleSubmit} sx={{ p: 2, my: 2 }}>
          <Typography variant="h6">{currentContent ? 'Edit' : 'Add'} Content</Typography>
          <TextField name="title" label="Title" value={formData.title} onChange={handleInputChange} fullWidth margin="normal" required />
          <FormControl fullWidth margin="normal">
            <InputLabel>Discipline</InputLabel>
            <Select name="disciplina" value={formData.disciplina} onChange={handleInputChange} required>
              <MenuItem value="Math">Math</MenuItem>
              <MenuItem value="Science">Science</MenuItem>
              <MenuItem value="History">History</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Type</InputLabel>
            <Select name="tipo" value={formData.tipo} onChange={handleInputChange} required>
              <MenuItem value="pdf">PDF</MenuItem>
              <MenuItem value="video">Video</MenuItem>
              <MenuItem value="exercicio">Exercise</MenuItem>
            </Select>
          </FormControl>

          {(formData.tipo === 'pdf' || formData.tipo === 'video') && (
            <TextField type="file" onChange={handleFileChange} fullWidth margin="normal" />
          )}

          {formData.tipo === 'exercicio' && (
            <Box>
              <Typography variant="subtitle1">Questions</Typography>
              {formData.questoes.map((q, i) => (
                <Paper key={i} sx={{ p: 2, my: 1 }}>
                  <TextField label={`Question ${i + 1}`} value={q.pergunta} onChange={e => handleQuestionChange(i, 'pergunta', e.target.value)} fullWidth margin="dense" />
                  <TextField label="Options (comma-separated)" value={q.opcoes.join(', ')} onChange={e => handleQuestionChange(i, 'opcoes', e.target.value)} fullWidth margin="dense" />
                  <TextField label="Correct Answer" value={q.respostaCorreta} onChange={e => handleQuestionChange(i, 'respostaCorreta', e.target.value)} fullWidth margin="dense" />
                  <TextField label="Explanation" value={q.explicacao} onChange={e => handleQuestionChange(i, 'explicacao', e.target.value)} fullWidth margin="dense" />
                  <Button size="small" color="secondary" onClick={() => removeQuestion(i)}>Remove</Button>
                </Paper>
              ))}
              <Button onClick={addQuestion}>Add Question</Button>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save'}</Button>
            <Button onClick={resetForm} sx={{ ml: 2 }}>Cancel</Button>
          </Box>
        </Paper>
      )}

      <TableContainer component={Paper} sx={{ mt: 4 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Discipline</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4}><CircularProgress /></TableCell></TableRow>
            ) : (
              contents.map(content => (
                <TableRow key={content.id}>
                  <TableCell>{content.title}</TableCell>
                  <TableCell>{content.disciplina}</TableCell>
                  <TableCell>{content.tipo}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleEdit(content)}><Edit /></IconButton>
                    <IconButton onClick={() => handleDelete(content.id)}><Delete /></IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default Admin;
