const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const ResumeParser = require('../parsers/resumeParser');
const ResumeSuggestions = require('../utils/resumeSuggestions');

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

        // Update profile with resume data (keeping existing register_number)
        const updateQuery = `
      UPDATE candidate_profiles 
      SET 
        f_name = COALESCE($1, f_name),
        m_name = COALESCE($2, m_name),
        l_name = COALESCE($3, l_name),
        cgpa = COALESCE($4, cgpa),
        branch = COALESCE($5, branch),
        academic_year = COALESCE($6, academic_year)
      WHERE user_id = $7
      RETURNING *
    `;

        const profileResult = await pool.query(updateQuery, [
            validateField(parsedData.f_name, 255) || null,
            validateField(parsedData.m_name, 255) || null,
            validateField(parsedData.l_name, 255) || null,
            parsedData.cgpa || null,
            parsedData.branch || null,
            parsedData.academic_year || null,
            req.user.id
        ]);

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

        // Generate ATS suggestions (THIS IS THE CORRECT PLACEMENT)
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


module.exports = router;