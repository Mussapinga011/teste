import React, { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, Navigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Grid,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';

const Dashboard = () => {
  const [user, loading] = useAuthState(auth);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            setProgress(userDocSnap.data().progress);
          } else {
            // Handle case where user document doesn't exist yet
            setProgress({});
          }
        } catch (err) {
          setError('Failed to fetch progress.');
          console.error(err);
        }
      }
    };

    fetchProgress();
  }, [user]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Dashboard
        </Typography>
        <Typography variant="h6">Welcome, {user.displayName || user.email}!</Typography>
        <Button variant="contained" onClick={() => signOut(auth)} sx={{ mt: 2 }}>
          Logout
        </Button>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h5" component="h2">
                        Study Library
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Access all your study materials, including PDFs, videos, and exercises.
                    </Typography>
                    <Button
                        component={Link}
                        to="/library"
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        Go to Library
                    </Button>
                </CardContent>
            </Card>
        </Grid>
        <Grid item xs={12} md={6}>
            <Card>
                <CardContent>
                    <Typography variant="h5" component="h2">
                        Quizzes
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Test your knowledge with practice quizzes.
                    </Typography>
                    <Button
                        component={Link}
                        to="/quizzes"
                        variant="contained"
                        sx={{ mt: 2 }}
                    >
                        Start a Quiz
                    </Button>
                </CardContent>
            </Card>
        </Grid>
      </Grid>


      <Box sx={{ my: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Your Progress
        </Typography>
        {error && <Typography color="error">{error}</Typography>}
        {progress ? (
          <Grid container spacing={2}>
            {Object.keys(progress).length > 0 ? (
              Object.entries(progress).map(([subject, data]) => (
                <Grid item xs={12} sm={6} md={4} key={subject}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{subject}</Typography>
                      <Typography>Correct: {data.acertos}</Typography>
                      <Typography>Errors: {data.erros}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            ) : (
              <Typography>No progress yet. Start a quiz to see your progress!</Typography>
            )}
          </Grid>
        ) : (
          !error && <CircularProgress />
        )}
      </Box>
    </Container>
  );
};

export default Dashboard;
