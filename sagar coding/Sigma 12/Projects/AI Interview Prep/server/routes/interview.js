import express from 'express';
import { analyzeAnswer, generateInterviewFeedback } from '../ai/aiService.js';

const router = express.Router();

router.post('/api/analyze-answer', async (req, res) => {
  try {
    const {
      question = '',
      answer = '',
      role = 'Software Engineer',
      interviewType = 'behavioral',
    } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Missing required field: question' });
    }

    if (!answer || typeof answer !== 'string' || !answer.trim()) {
      return res.status(400).json({ error: 'Missing required field: answer' });
    }

    const evaluation = await analyzeAnswer({
      question: question.trim(),
      answer: answer.trim(),
      role: String(role).trim(),
      interviewType: String(interviewType).trim(),
    });

    return res.status(200).json(evaluation);
  } catch (err) {
    console.error('[Route: analyze-answer] Error:', err);
    return res.status(500).json({
      error: 'Failed to analyze answer.',
      message: err.message,
    });
  }
});

router.post('/api/interview-feedback', async (req, res) => {
  try {
    const {
      transcript = [],
      role = 'Software Engineer',
      interviewType = 'behavioral',
    } = req.body || {};

    if (!Array.isArray(transcript)) {
      return res.status(400).json({ error: 'Field transcript must be an array of messages.' });
    }

    const feedback = await generateInterviewFeedback({
      transcript,
      role: String(role).trim(),
      interviewType: String(interviewType).trim(),
    });

    return res.status(200).json(feedback);
  } catch (err) {
    console.error('[Route: interview-feedback] Error:', err);
    return res.status(500).json({
      error: 'Failed to generate interview debrief feedback.',
      message: err.message,
    });
  }
});

export default router;
