import express from 'express';
import { analyzeSpeech } from '../ai/aiService.js';

const router = express.Router();

router.post('/api/speech-to-text', async (req, res) => {
  try {
    const { audio, text = '', question = '' } = req.body || {};

    const speechResult = await analyzeSpeech({
      audio,
      text: typeof text === 'string' ? text.trim() : '',
      question: typeof question === 'string' ? question.trim() : '',
    });

    return res.status(200).json(speechResult);
  } catch (err) {
    console.error('[Route: speech-to-text] Error:', err);
    return res.status(500).json({
      error: 'Failed to process audio or transcribe speech.',
      message: err.message,
    });
  }
});

export default router;
