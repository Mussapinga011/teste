import React, { useState } from 'react';
import { db, auth } from '../services/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
  Container,
  Typography,
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Card,
  CardContent,
  RadioGroup,
  FormControlLabel,
  Radio,
} from '@mui/material';

const functions = getFunctions();

const Quizzes = () => {
  const [user] = useAuthState(auth);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [disciplina, setDisciplina] = useState('');

  const fetchQuestions = async () => {
    if (!disciplina) {
      setError("Please select a discipline.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const generateQuiz = httpsCallable(functions, 'quizzes-generateQuiz');
      const result = await generateQuiz({ disciplina });
      setQuestions(result.data);
      setQuizStarted(true);
    } catch (err) {
      setError('Failed to fetch questions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (event) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: event.target.value,
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleSubmitQuiz = async () => {
    let finalScore = 0;
    questions.forEach((question, index) => {
      if (answers[index] === question.respostaCorreta) {
        finalScore++;
      }
    });
    setScore(finalScore);
    setQuizFinished(true);

    if (user) {
      try {
        const erros = questions.length - finalScore;
        const registerProgress = httpsCallable(functions, 'users-registerProgress');
        await registerProgress({ disciplina, acertos: finalScore, erros });

        await addDoc(collection(db, 'simulados'), {
          userId: user.uid,
          data: serverTimestamp(),
          questoes: questions.map((q, i) => ({ ...q, respostaUsuario: answers[i] || null })),
          resultado: {
            acertos: finalScore,
            erros: erros,
            nota: (finalScore / questions.length) * 100,
          },
          disciplina: disciplina,
        });

      } catch (err) {
        console.error("Error saving quiz results: ", err);
      }
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  if (quizFinished) {
    return (
      <Container>
        <Typography variant="h4">Quiz Finished!</Typography>
        <Typography variant="h6">Your score: {score} / {questions.length}</Typography>
        <Box>
          {questions.map((q, i) => (
            <Card key={i} sx={{ my: 2 }}>
              <CardContent>
                <Typography>{q.pergunta}</Typography>
                <Typography>Your answer: {answers[i]}</Typography>
                <Typography>Correct answer: {q.respostaCorreta}</Typography>
                <Typography>Explanation: {q.explicacao}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
        <Button onClick={() => {
          setQuizFinished(false);
          setQuizStarted(false);
          setAnswers({});
          setCurrentQuestionIndex(0);
        }}>Take Another Quiz</Button>
      </Container>
    )
  }

  if (!quizStarted) {
    return (
      <Container>
        <Typography variant="h4">Take a Quiz</Typography>
        <FormControl fullWidth sx={{ my: 2 }}>
          <InputLabel>Discipline</InputLabel>
          <Select
            value={disciplina}
            onChange={(e) => setDisciplina(e.target.value)}
          >
            <MenuItem value="Math">Math</MenuItem>
            <MenuItem value="Science">Science</MenuItem>
            <MenuItem value="History">History</MenuItem>
          </Select>
        </FormControl>
        <Button onClick={fetchQuestions} variant="contained">Start Quiz</Button>
      </Container>
    );
  }

  return (
    <Container>
      <Card>
        <CardContent>
          <Typography variant="h5">{questions[currentQuestionIndex].pergunta}</Typography>
          <FormControl component="fieldset">
            <RadioGroup
              value={answers[currentQuestionIndex] || ''}
              onChange={handleAnswerChange}
            >
              {questions[currentQuestionIndex].opcoes.map((option, i) => (
                <FormControlLabel key={i} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      {currentQuestionIndex < questions.length - 1 ? (
        <Button onClick={handleNextQuestion} variant="contained" sx={{ mt: 2 }}>Next</Button>
      ) : (
        <Button onClick={handleSubmitQuiz} variant="contained" sx={{ mt: 2 }}>Submit</Button>
      )}
    </Container>
  );
};

export default Quizzes;
