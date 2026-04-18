import Groq from 'groq-sdk';
import { extractPdfText } from '../utils/extractPdfText.js';

const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is missing in backend/.env');
  }
  return new Groq({ apiKey });
};

const cleanJsonText = (text) => {
  return String(text || '')
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
};

const extractLikelyJson = (text) => {
  const cleaned = cleanJsonText(text);
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    return cleaned;
  }

  return cleaned.slice(start, end + 1);
};

const parseJsonSafely = (text) => {
  const candidate = extractLikelyJson(text);

  try {
    return JSON.parse(candidate);
  } catch {
    // Basic normalization for common model output mistakes.
    const normalized = candidate
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      .replace(/,\s*([}\]])/g, '$1');

    return JSON.parse(normalized);
  }
};

export const checkATS = async (req, res) => {
  let groq;
  try {
    groq = getGroqClient();
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }

  const resumeFile = req.files?.resume?.[0] || null;
  const jobDescriptionFile = req.files?.jobDescriptionFile?.[0] || null;
  const jobDescriptionTextInput = (req.body?.jobDescriptionText || '').trim();

  if (!resumeFile) {
    return res.status(400).json({ message: 'No PDF file uploaded' });
  }

  if (!jobDescriptionFile && !jobDescriptionTextInput) {
    return res.status(400).json({
      error: 'invalid_jd',
      message: 'The job description seems invalid. Please paste or upload a real job posting.',
    });
  }

  let resumeText = '';
  try {
    resumeText = await extractPdfText(resumeFile.buffer);
  } catch (error) {
    return res.status(400).json({ message: 'Could not read PDF. Please make sure it is a valid PDF file.' });
  }

  let jobDescriptionText = jobDescriptionTextInput;
  if (jobDescriptionFile) {
    try {
      jobDescriptionText = await extractPdfText(jobDescriptionFile.buffer);
    } catch (error) {
      return res.status(400).json({ message: 'Could not read PDF. Please make sure it is a valid PDF file.' });
    }
  }

  let classifierContent = '';
  try {
    const classifierCompletion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 300,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You are a document classifier. You will receive two texts. Text 1 is supposed to be a resume. Text 2 is supposed to be a job description. Classify each as valid or invalid. Return ONLY this JSON: { resumeValid: true/false, jdValid: true/false, reason: string }',
        },
        {
          role: 'user',
          content: `RESUME TEXT (first 1000 characters):\n${resumeText.slice(0, 1000)}\n\nJOB DESCRIPTION TEXT (first 1000 characters):\n${jobDescriptionText.slice(0, 1000)}`,
        },
      ],
    });

    classifierContent = classifierCompletion?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('ATS classifier call failed:', error?.message || error);
    return res.status(500).json({ message: `AI analysis failed: ${error?.message || 'Unknown error'}` });
  }

  try {
    const classification = parseJsonSafely(classifierContent);

    if (!classification?.resumeValid) {
      return res.status(400).json({
        error: 'invalid_resume',
        message: "The uploaded file doesn't appear to be a resume. Please upload your actual resume PDF.",
        reason: classification?.reason || 'The uploaded document content does not match a resume/CV format.',
      });
    }

    if (!classification?.jdValid) {
      return res.status(400).json({
        error: 'invalid_jd',
        message: 'The job description seems invalid. Please paste or upload a real job posting.',
        reason: classification?.reason || 'The supplied job description content is not valid job posting content.',
      });
    }
  } catch (error) {
    console.error('ATS classifier parsing failed:', {
      error: error?.message || error,
      raw: classifierContent,
    });
    return res.status(500).json({ message: 'AI analysis failed: invalid classifier response format.' });
  }

  let content = '';
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      max_tokens: 1500,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: "You are a senior technical recruiter and ATS expert with 15 years of experience. You will receive a student's resume and a specific job description. Your job is to give brutally honest, specific, professional feedback. Do NOT give generic advice. Every single point must be directly tied to the job description provided. Reference specific requirements from the JD in your feedback. You must infer the exact job role the student is targeting from the JD.",
        },
        {
          role: 'user',
          content: `JOB DESCRIPTION:\n${jobDescriptionText}\n\nSTUDENT RESUME:\n${resumeText}\n\nAnalyze this resume against the job description above and return ONLY this JSON:\n{\n  inferredRole: string (exact job title inferred from JD),\n  score: number (0-100, strict ATS scoring),\n  summary: string (2-3 sentences, role-specific overall assessment),\n  strengths: array of strings (what the resume does well FOR THIS SPECIFIC ROLE),\n  mistakes: array of strings (specific problems that will hurt ATS for this role),\n  missingKeywords: array of strings (keywords from JD missing in resume),\n  matchedKeywords: array of strings (JD keywords found in resume),\n  improvements: array of objects each with:\n    { section: string, issue: string, suggestion: string, priority: 'high'|'medium'|'low' }\n  verdict: string ('Strong Match' | 'Moderate Match' | 'Weak Match' | 'Not a Match')\n}\nBe strict. Be specific. Reference the JD. Do not make up generic advice.`,
        },
      ],
    });

    content = completion?.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.error('ATS final analysis call failed:', error?.message || error);
    return res.status(500).json({ message: `AI analysis failed: ${error?.message || 'Unknown error'}` });
  }

  try {
    const parsed = parseJsonSafely(content);
    return res.json(parsed);
  } catch (error) {
    console.error('ATS final analysis parsing failed:', {
      error: error?.message || error,
      raw: content,
    });
    return res.status(500).json({ message: 'AI analysis failed: invalid analysis response format.' });
  }
};
