import express from 'express';
import { analyzeResume } from '../ai/aiService.js';

const router = express.Router();

const handleAnalyzeResume = async (req, res) => {
  try {
    const { resumeText, targetRole } = req.body || {};

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return res.status(400).json({ error: 'Missing or empty required field: resumeText' });
    }

    if (!targetRole || typeof targetRole !== 'string' || !targetRole.trim()) {
      return res.status(400).json({ error: 'Missing or empty required field: targetRole' });
    }

    const result = await analyzeResume(resumeText.trim(), targetRole.trim());
    return res.status(200).json(result);
  } catch (err) {
    console.error('[Route: analyze-resume] Unexpected error:', err);
    return res.status(500).json({
      error: 'An internal error occurred while analyzing the resume.',
      message: err.message,
    });
  }
};

// Mount both standard /api endpoint and Supabase Edge Function compatibility path
router.post('/api/analyze-resume', handleAnalyzeResume);
router.post('/functions/v1/analyze-resume', handleAnalyzeResume);

export default router;
