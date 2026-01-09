// backend/routes/company.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Create uploads directory for job descriptions
const jdUploadDir = path.join(__dirname, '../uploads/job-descriptions');
if (!fs.existsSync(jdUploadDir)) {
    fs.mkdirSync(jdUploadDir, { recursive: true });
}

// Configure multer for JD upload
const jdStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, jdUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'jd-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const jdUpload = multer({
    storage: jdStorage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|docx|doc/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype) ||
            file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only PDF and DOCX files are allowed for job descriptions!'));
        }
    },
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Company Registration with JD Upload
router.post('/register', jdUpload.single('jobDescription'), async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        const {
            companyName,
            industry,
            website,
            description,
            contactPerson,
            email,
            phone,
            password,
            // Job details
            jobTitle,
            jobDescription,
            requiredCGPA,
            requiredBranches,
            salary,
            location,
            jobType,
            deadline
        } = req.body;

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Create company user account
        const userResult = await client.query(
            `INSERT INTO users (email, password, role, created_at)
             VALUES ($1, $2, 'company', NOW())
             RETURNING id`,
            [email, hashedPassword]
        );

        const userId = userResult.rows[0].id;

        // 2. Create company profile
        const companyResult = await client.query(
            `INSERT INTO companies (user_id, company_name, industry, website, description, contact_person, phone, created_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
             RETURNING id`,
            [userId, companyName, industry, website, description, contactPerson, phone]
        );

        const companyId = companyResult.rows[0].id;

        // 3. Create initial job posting
        const jdFilePath = req.file ? `/uploads/job-descriptions/${req.file.filename}` : null;

        const jobResult = await client.query(
            `INSERT INTO jobs (
                company_id, 
                job_title, 
                description, 
                required_cgpa, 
                required_branches, 
                salary, 
                location, 
                job_type,
                application_deadline,
                job_description_file,
                status,
                created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', NOW())
            RETURNING id`,
            [
                companyId,
                jobTitle,
                jobDescription,
                requiredCGPA || 0,
                requiredBranches ? JSON.stringify(requiredBranches) : null,
                salary,
                location,
                jobType,
                deadline,
                jdFilePath
            ]
        );

        await client.query('COMMIT');

        res.json({
            success: true,
            message: 'Company registered successfully. Awaiting admin approval.',
            companyId: companyId,
            jobId: jobResult.rows[0].id,
            jdUploaded: !!req.file
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Company registration error:', error);
        res.status(500).json({
            error: 'Failed to register company',
            details: error.message
        });
    } finally {
        client.release();
    }
});

// Download Job Description
router.get('/download-jd/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;
        
        const result = await pool.query(
            'SELECT job_description_file FROM jobs WHERE id = $1',
            [jobId]
        );

        if (!result.rows[0] || !result.rows[0].job_description_file) {
            return res.status(404).json({ error: 'Job description not found' });
        }

        const filePath = path.join(__dirname, '..', result.rows[0].job_description_file);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found on server' });
        }

        res.download(filePath);
    } catch (error) {
        console.error('JD download error:', error);
        res.status(500).json({ error: 'Failed to download job description' });
    }
});

module.exports = router;