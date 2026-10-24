import express from 'express';
import { generateQuestions } from '../ai/aiService.js';

const router = express.Router();

router.post('/api/generate-questions', async (req, res) => {
  try {
    const {
      role = 'Software Engineer',
      type = 'behavioral',
      count = 5,
      resumeKeywords = [],
      difficulty = 'Medium',
    } = req.body || {};

    const questionsData = await generateQuestions({
      role: String(role).trim(),
      type: String(type).trim().toLowerCase(),
      count: Math.max(1, Math.min(15, parseInt(count, 10) || 5)),
      resumeKeywords: Array.isArray(resumeKeywords) ? resumeKeywords : [],
      difficulty: String(difficulty).trim(),
    });

    return res.status(200).json(questionsData);
  } catch (err) {
    console.error('[Route: generate-questions] Error:', err);
    return res.status(500).json({
      error: 'Failed to generate interview questions.',
      message: err.message,
    });
  }
});

export default router;
