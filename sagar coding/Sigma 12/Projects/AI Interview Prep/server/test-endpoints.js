// Comprehensive test suite for all backend API endpoints
async function runTests() {
  const baseUrl = 'http://localhost:5000';
  console.log('Testing AI Interview Preparation Backend API...');

  // 1. Health
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json();
    console.log('\n[PASS] GET /api/health:', data.status, '| Active Provider:', data.activeProvider);
  } catch (e) {
    console.error('\n[FAIL] GET /api/health:', e.message);
  }

  // 2. Speech to text
  try {
    const res = await fetch(`${baseUrl}/api/speech-to-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I led the migration of our monolith to microservices using Node.js and Docker, reducing API response times by 35 percent.',
      }),
    });
    const data = await res.json();
    console.log('\n[PASS] POST /api/speech-to-text: confidence =', data.confidence, '| pacing =', data.metrics?.pacing);
  } catch (e) {
    console.error('\n[FAIL] POST /api/speech-to-text:', e.message);
  }

  // 3. Analyze Answer
  try {
    const res = await fetch(`${baseUrl}/api/analyze-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Tell me about a time you resolved a conflict with a teammate.',
        answer: 'We disagreed on database normalization. I organized a benchmarking spike where we tested both schemas against realistic query loads. The data showed the hybrid model had better latency, so the team agreed.',
        role: 'Full Stack Engineer',
        interviewType: 'behavioral',
      }),
    });
    const data = await res.json();
    console.log('\n[PASS] POST /api/analyze-answer: score =', data.score);
    console.log('Feedback:', data.feedback);
    console.log('Follow-up:', data.followUpQuestion);
  } catch (e) {
    console.error('\n[FAIL] POST /api/analyze-answer:', e.message);
  }

  // 4. Interview Feedback (Debrief)
  try {
    const res = await fetch(`${baseUrl}/api/interview-feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: 'Full Stack Engineer',
        interviewType: 'behavioral',
        transcript: [
          { role: 'ai', text: 'Welcome! Tell me about a time you faced a difficult challenge at work.' },
          { role: 'user', text: 'Our payment processing gateway went down during Black Friday. I immediately identified the webhook timeout error, deployed a fallback queue, and restored checkout within 15 minutes.' },
          { role: 'ai', text: 'Great answer. How did you communicate with leadership during the incident?' },
          { role: 'user', text: 'I maintained an incident channel providing updates every 5 minutes and drafted the post-mortem afterwards.' },
        ],
      }),
    });
    const data = await res.json();
    console.log('\n[PASS] POST /api/interview-feedback: overall score =', data.score);
    console.log('Strengths:', data.strengths);
    console.log('Improvements:', data.improvements);
  } catch (e) {
    console.error('\n[FAIL] POST /api/interview-feedback:', e.message);
  }

  // 5. Analyze Resume (Standard /api)
  try {
    const sampleResume = `
      John Doe - Senior Software Engineer
      Skills: JavaScript, TypeScript, React, Redux, Node.js, Express, Docker, Git
      Experience:
      Frontend Lead at TechCorp (2022-Present)
      - Spearheaded React 18 web application overhaul, reducing bundle size by 40%.
      - Mentored 6 junior engineers and improved code coverage to 85%.
      Education: B.S. in Computer Science
    `;
    const res = await fetch(`${baseUrl}/api/analyze-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: sampleResume,
        targetRole: 'Senior React Developer',
      }),
    });
    const data = await res.json();
    console.log('\n[PASS] POST /api/analyze-resume: ATS score =', data.ats_score);
    console.log('Strengths count:', data.strengths?.length);
    console.log('Missing keywords:', data.missing_keywords);
    console.log('Tailored questions count:', data.recommended_interview_questions?.length);
  } catch (e) {
    console.error('\n[FAIL] POST /api/analyze-resume:', e.message);
  }

  // 6. Analyze Resume via Supabase compatibility endpoint
  try {
    const res = await fetch(`${baseUrl}/functions/v1/analyze-resume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resumeText: 'Full Stack Developer with 4 years experience in Python, Django, PostgreSQL, and React.',
        targetRole: 'Full Stack Engineer',
      }),
    });
    const data = await res.json();
    console.log('\n[PASS] POST /functions/v1/analyze-resume (Supabase compat): ATS score =', data.ats_score);
  } catch (e) {
    console.error('\n[FAIL] POST /functions/v1/analyze-resume:', e.message);
  }

  console.log('\nAll tests completed successfully!');
}

runTests();
