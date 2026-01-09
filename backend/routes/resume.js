const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const ResumeParser = require('../parsers/resumeParser');
const ResumeSuggestions = require('../utils/resumeSuggestions');

// Admin-only middleware
const adminOnly = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};


function calculateATSScore(parsedData, profileData) {
    let score = 0;

    console.log('📊 Starting ATS calculation...');
    console.log('Input data:', {
        skills: parsedData.skills?.length,
        cgpa: parsedData.cgpa || profileData?.cgpa
    });

    // 1. Skills Score (40 points)
    const skills = parsedData.skills || [];
    const skillsCount = skills.length;
    const skillsScore = Math.min((skillsCount / 10) * 40, 40);
    score += skillsScore;
    console.log(`Skills: ${skillsCount} skills = ${skillsScore} points`);

    // 2. CGPA Score (30 points)
    const cgpa = parseFloat(parsedData.cgpa || profileData?.cgpa || 0);
    let cgpaScore = 0;
    if (cgpa >= 9.0) cgpaScore = 30;
    else if (cgpa >= 8.0) cgpaScore = 25;
    else if (cgpa >= 7.0) cgpaScore = 20;
    else if (cgpa >= 6.0) cgpaScore = 15;
    else if (cgpa > 0) cgpaScore = 10;
    score += cgpaScore;
    console.log(`CGPA: ${cgpa} = ${cgpaScore} points`);

    // 3. Profile Completeness (30 points)
    let completeness = 0;
    if (parsedData.f_name && parsedData.l_name) completeness += 10;
    if (parsedData.email) completeness += 5;
    if (parsedData.phone) completeness += 5;
    if (parsedData.branch || profileData?.branch) completeness += 5;
    if (parsedData.register_number || profileData?.register_number) completeness += 5;
    score += completeness;
    console.log(`Completeness: ${completeness} points`);

    const finalScore = Math.round(score);
    console.log(`✅ Final ATS Score: ${finalScore}%`);

    return finalScore;
}

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed!'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});


// Upload and parse resume
router.post('/upload', authenticateToken, upload.single('resume'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📄 File uploaded:', req.file.filename);

        const parser = new ResumeParser();
        const filePath = req.file.path;

        // Parse resume
        console.log('🔍 Parsing resume...');
        const parsedData = await parser.parseResume(filePath);
        console.log('✅ Resume parsed successfully');
        console.log('Extracted data:', {
            name: `${parsedData.f_name} ${parsedData.l_name}`,
            email: parsedData.email,
            skills: parsedData.skills.length,
            cgpa: parsedData.cgpa,
            branch: parsedData.branch
        });

        // Validate parsed data before inserting
        const validateField = (value, maxLength) => {
            if (!value) return null;
            return value.length > maxLength ? value.substring(0, maxLength) : value;
        };

        // Check if parsing actually worked
        if (!parsedData.f_name || parsedData.f_name.includes('PDF') || parsedData.f_name.length > 100) {
            throw new Error('Unable to extract readable text from PDF. Please upload a DOCX file or a text-based PDF.');
        }

        const existingProfile = await pool.query(
            'SELECT * FROM candidate_profiles WHERE user_id = $1',
            [req.user.id]
        );
        // Calculate ATS Score BEFORE updating profile
        const atsScore = calculateATSScore(parsedData);
        console.log('📊 Calculated ATS Score:', atsScore);

        const updateQuery = `
    UPDATE candidate_profiles 
    SET 
        f_name = COALESCE($1, f_name),
        m_name = COALESCE($2, m_name),
        l_name = COALESCE($3, l_name),
        cgpa = COALESCE($4, cgpa),
        branch = COALESCE($5, branch),
        academic_year = COALESCE($6, academic_year),
        ats_score = COALESCE($7, ats_score)
    WHERE user_id = $8
    RETURNING *
`;

        const profileResult = await pool.query(updateQuery, [
            validateField(parsedData.f_name, 255) || null,
            validateField(parsedData.m_name, 255) || null,
            validateField(parsedData.l_name, 255) || null,
            parsedData.cgpa || null,
            parsedData.branch || null,
            parsedData.academic_year || null,
            atsScore,  // ADD THIS
            req.user.id
        ]);

        // Store resume file path in database
        await pool.query(
            `INSERT INTO resumes (user_id, file_path, uploaded_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (user_id) 
             DO UPDATE SET file_path = $2, uploaded_at = NOW()`,
            [req.user.id, req.file.path]
        );

        // Store skills in candidate_skills table
        if (parsedData.skills && parsedData.skills.length > 0) {
            // Delete existing skills first
            await pool.query('DELETE FROM candidate_skills WHERE user_id = $1', [req.user.id]);

            // Insert new skills
            for (let skill of parsedData.skills) {
                await pool.query(
                    'INSERT INTO candidate_skills (user_id, skill) VALUES ($1, $2) ON CONFLICT (user_id, skill) DO NOTHING',
                    [req.user.id, skill]
                );
            }
            console.log(`✅ Stored ${parsedData.skills.length} skills in database`);
        }

        // Generate ATS suggestions
        const suggestionEngine = new ResumeSuggestions();
        const suggestions = suggestionEngine.generateSuggestions(parsedData, profileResult.rows[0]);

        res.json({
            success: true,
            message: 'Resume parsed successfully',
            profile: profileResult.rows[0],
            extracted_data: {
                email: parsedData.email,
                phone: parsedData.phone,
                skills: parsedData.skills,
                cgpa: parsedData.cgpa,
                branch: parsedData.branch,
                register_number: parsedData.register_number,
                academic_year: parsedData.academic_year
            },
            ats_analysis: suggestions
        });

    } catch (error) {
        console.error('❌ Resume upload error:', error);
        res.status(500).json({
            error: 'Failed to process resume',
            details: error.message
        });
    }
});

// Get candidate profile with skills
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const profileResult = await pool.query(
            'SELECT * FROM candidate_profiles WHERE user_id = $1',
            [req.user.id]
        );

        if (profileResult.rows.length === 0) {
            return res.status(404).json({ error: 'Profile not found' });
        }

        const profile = profileResult.rows[0];

        // Get skills
        const skillsResult = await pool.query(
            'SELECT skill FROM candidate_skills WHERE user_id = $1 ORDER BY skill',
            [req.user.id]
        );

        const skills = skillsResult.rows.map(row => row.skill);

        res.json({
            success: true,
            profile: {
                ...profile,
                skills: skills
            }
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// View resume (Admin only)
router.get('/view/:candidateId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { candidateId } = req.params;

        // Get candidate info and resume path
        const result = await pool.query(
            `SELECT 
                cp.f_name, 
                cp.l_name, 
                u.email,
                r.file_path
             FROM candidate_profiles cp
             JOIN users u ON cp.user_id = u.id
             LEFT JOIN resumes r ON r.user_id = cp.user_id
             WHERE cp.user_id = $1`,
            [candidateId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Candidate not found' });
        }

        const candidate = result.rows[0];

        if (!candidate.file_path) {
            return res.status(404).json({ error: 'Resume not uploaded yet' });
        }

        // Convert absolute path to relative URL
        const fileName = path.basename(candidate.file_path);
        const resumeUrl = `/uploads/${fileName}`;

        res.json({
            resumeUrl: resumeUrl,
            candidate: {
                name: `${candidate.f_name} ${candidate.l_name}`,
                email: candidate.email
            }
        });
    } catch (error) {
        console.error('Resume view error:', error);
        res.status(500).json({ error: 'Failed to fetch resume' });
    }
});

// Download resume (Admin only)
router.get('/download/:candidateId', authenticateToken, adminOnly, async (req, res) => {
    try {
        const { candidateId } = req.params;

        const result = await pool.query(
            `SELECT r.file_path, cp.f_name, cp.l_name
             FROM resumes r
             JOIN candidate_profiles cp ON r.user_id = cp.user_id
             WHERE r.user_id = $1`,
            [candidateId]
        );

        if (!result.rows[0]) {
            return res.status(404).json({ error: 'Resume not found' });
        }

        const filePath = result.rows[0].file_path;
        const candidateName = `${result.rows[0].f_name}_${result.rows[0].l_name}`;

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Resume file not found on server' });
        }

        res.download(filePath, `Resume_${candidateName}.pdf`);
    } catch (error) {
        console.error('Resume download error:', error);
        res.status(500).json({ error: 'Failed to download resume' });
    }
});

module.exports = router;