import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Paper,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Progress = () => {
  const [user, loading] = useAuthState(auth);
  const [progress, setProgress] = useState(null);
  const [simulados, setSimulados] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        try {
          // Fetch progress
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setProgress(userDocSnap.data().progress);
          }

          // Fetch simulados
          const q = query(collection(db, 'simulados'), where('userId', '==', user.uid));
          const querySnapshot = await getDocs(q);
          const simuladosList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setSimulados(simuladosList);

        } catch (err) {
          setError('Failed to fetch data.');
          console.error(err);
        }
      }
    };

    fetchData();
  }, [user]);

  if (loading || (!progress && !error)) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const progressData = progress ? Object.entries(progress).map(([name, value]) => ({ name, ...value })) : [];

  const totalAcertos = progressData.reduce((acc, p) => acc + p.acertos, 0);
  const totalErros = progressData.reduce((acc, p) => acc + p.erros, 0);
  const totalQuestoes = totalAcertos + totalErros;
  const percentualAcertos = totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0;

  const pieData = [
    { name: 'Correct', value: totalAcertos },
    { name: 'Incorrect', value: totalErros },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Your Progress and Statistics
        </Typography>

        <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Total Questions</Typography>
                        <Typography variant="h4">{totalQuestoes}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Correct Answers</Typography>
                        <Typography variant="h4">{totalAcertos}</Typography>
                    </CardContent>
                </Card>
            </Grid>
            <Grid item xs={12} md={4}>
                <Card>
                    <CardContent>
                        <Typography variant="h6">Success Rate</Typography>
                        <Typography variant="h4">{percentualAcertos.toFixed(2)}%</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>

        <Grid container spacing={4} sx={{mt: 2}}>
          <Grid item xs={12} md={8}>
            <Paper sx={{p: 2}}>
              <Typography variant="h6" gutterBottom>Performance by Discipline</Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={progressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="acertos" fill="#82ca9d" name="Correct" />
                  <Bar dataKey="erros" fill="#8884d8" name="Incorrect" />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{p: 2}}>
               <Typography variant="h6" gutterBottom>Overall Performance</Typography>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                    <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>

        <Box sx={{ my: 4 }}>
            <Typography variant="h5" gutterBottom>Quiz History</Typography>
            {simulados.map(simulado => (
                <Card key={simulado.id} sx={{mb: 2}}>
                    <CardContent>
                        <Typography variant="h6">{simulado.disciplina}</Typography>
                        <Typography>Date: {new Date(simulado.data.seconds * 1000).toLocaleDateString()}</Typography>
                        <Typography>Score: {simulado.resultado.nota.toFixed(2)}%</Typography>
                    </CardContent>
                </Card>
            ))}
        </Box>

      </Box>
    </Container>
  );
};

export default Progress;
