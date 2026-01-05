const mammoth = require('mammoth');
const fs = require('fs');
const pdfParse = require('pdf-parse');

class ResumeParser {
    constructor() {
        // Comprehensive skill keywords
        this.skillKeywords = new Set([
            'python', 'java', 'javascript', 'typescript', 'c++', 'c#', 'c', 'ruby', 'php', 'swift', 'kotlin', 'go', 'rust',
            'react', 'reactjs', 'angular', 'vue', 'vuejs', 'node.js', 'nodejs', 'express', 'django', 'flask', 'spring boot', 'asp.net',
            'html', 'html5', 'css', 'css3', 'sass', 'scss', 'bootstrap', 'tailwind', 'material ui', 'jquery',
            'sql', 'mysql', 'postgresql', 'mongodb', 'redis', 'cassandra', 'oracle', 'sqlite', 'nosql', 'dbms',
            'aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'jenkins', 'ci/cd', 'devops',
            'git', 'github', 'gitlab', 'bitbucket', 'jira', 'agile', 'scrum', 'kanban',
            'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data science', 'nlp', 'computer vision',
            'pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit-learn', 'keras', 'opencv', 'yolo',
            'rest api', 'restful', 'graphql', 'microservices', 'websockets', 'grpc', 'api',
            'linux', 'unix', 'bash', 'powershell', 'windows', 'shell scripting',
            'tableau', 'power bi', 'excel', 'data visualization', 'matplotlib', 'seaborn',
            'testing', 'unit testing', 'integration testing', 'selenium', 'jest', 'mocha', 'junit', 'pytest',
            'firebase', 'dynamodb', 'elasticsearch',
            'next.js', 'nuxt.js', 'gatsby', 'redux', 'mobx', 'webpack', 'vite',
            'android', 'ios', 'react native', 'flutter', 'xamarin',
            'photoshop', 'illustrator', 'figma', 'sketch', 'adobe xd', 'ui/ux',
            'blockchain', 'solidity', 'web3', 'ethereum', 'smart contracts',
            'twilio', 'autoencoder', 'u-net', 'neural networks', 'cnn', 'rnn',
            'data structures', 'algorithms', 'oop', 'object-oriented programming', 'vs code', 'visual studio'
        ]);

        // Branch mappings
        this.branchMappings = {
            'CSE': ['computer science', 'cs', 'cse', 'computer engineering', 'computer', 'computing'],
            'ECE': ['electronics', 'ece', 'electronics and communication', 'electronics & communication'],
            'EEE': ['electrical', 'eee', 'electrical engineering', 'electrical & electronics'],
            'MECH': ['mechanical', 'mech', 'mechanical engineering'],
            'CIVIL': ['civil', 'civil engineering'],
            'IT': ['information technology', 'it', 'information science', 'information systems']
        };
    }

    // Enhanced PDF text extraction with multiple methods
    async extractTextFromPDF(filePath) {
        try {
            console.log('🔍 Attempting PDF extraction...');

            const dataBuffer = fs.readFileSync(filePath);

            // Method 1: Using pdf-parse with custom options
            const options = {
                max: 0, // Parse all pages
                version: 'default'
            };

            const data = await pdfParse(dataBuffer, options);

            console.log(`📄 PDF Info:
        - Total pages: ${data.numpages}
        - Text length: ${data.text.length} characters
        - Has text: ${data.text.length > 100 ? 'Yes' : 'No'}`);

            if (data.text && data.text.length > 50) {
                console.log('✅ PDF text extracted successfully');
                console.log('First 200 chars:', data.text.substring(0, 200));
                return data.text;
            }

            // If extraction failed or text is too short
            console.log('⚠️ PDF extraction returned minimal text');
            console.log('Full extracted text:', data.text);

            // Try alternative extraction
            return this.extractTextAlternative(dataBuffer);

        } catch (error) {
            console.error('❌ Primary PDF extraction failed:', error.message);

            try {
                const dataBuffer = fs.readFileSync(filePath);
                return this.extractTextAlternative(dataBuffer);
            } catch (altError) {
                console.error('❌ Alternative PDF extraction also failed:', altError.message);
                throw new Error('Unable to extract text from PDF. The file may be an image-based PDF or corrupted.');
            }
        }
    }

    // Alternative text extraction method
    extractTextAlternative(dataBuffer) {
        console.log('🔄 Trying alternative extraction method...');

        // Try to extract raw text from buffer
        const text = dataBuffer.toString('utf8');

        // Clean up the text
        const cleaned = text
            .replace(/[^\x20-\x7E\n\r]/g, ' ') // Remove non-printable characters
            .replace(/\s+/g, ' ')               // Replace multiple spaces with single space
            .trim();

        if (cleaned.length > 100) {
            console.log('✅ Alternative extraction succeeded');
            return cleaned;
        }

        throw new Error('Alternative extraction failed - no readable text found');
    }

    // Extract text from DOCX
    async extractTextFromDOCX(filePath) {
        try {
            const result = await mammoth.extractRawText({ path: filePath });
            console.log(`✅ DOCX extracted: ${result.value.length} characters`);
            return result.value;
        } catch (error) {
            console.error('Error extracting DOCX:', error);
            throw new Error('Failed to parse DOCX');
        }
    }

    // Main extraction method
    async extractText(filePath) {
        const ext = filePath.toLowerCase();
        if (ext.endsWith('.pdf')) {
            return await this.extractTextFromPDF(filePath);
        } else if (ext.endsWith('.docx')) {
            return await this.extractTextFromDOCX(filePath);
        } else {
            throw new Error('Unsupported file format. Only PDF and DOCX are supported.');
        }
    }

    // Extract email
    extractEmail(text) {
        const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
        const matches = text.match(emailRegex);
        if (matches && matches.length > 0) {
            console.log(`✅ Found email: ${matches[0]}`);
            return matches[0];
        }
        console.log('⚠️ No email found');
        return null;
    }

    // Extract phone
    extractPhone(text) {
        const phonePatterns = [
            /(?:\+91[\s-]?)?[6-9]\d{9}/g,     // Indian mobile with optional +91
            /[6-9]\d{9}/g,                     // 10 digit mobile
            /\d{10}/g                          // Any 10 digits
        ];

        for (let pattern of phonePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                const phone = matches[0];
                console.log(`✅ Found phone: ${phone}`);
                return phone;
            }
        }
        console.log('⚠️ No phone found');
        return null;
    }

    // Extract name
    extractName(text) {
        const lines = text.split('\n').filter(line => line.trim() && line.trim().length > 2);

        // Look for name in first 5 lines
        for (let i = 0; i < Math.min(5, lines.length); i++) {
            const line = lines[i].trim();

            // Skip lines with common resume keywords, emails, phones
            if (/@/.test(line) ||
                /\d{10}/.test(line) ||
                /github|linkedin|portfolio|objective|summary|education|experience/i.test(line)) {
                continue;
            }

            // Check if line looks like a name
            const words = line.split(/\s+/).filter(w => /^[A-Za-z]+$/.test(w) && w.length > 1);

            if (words.length >= 2 && words.length <= 4 && line.length < 50) {
                console.log(`✅ Found name: ${line}`);
                return {
                    f_name: words[0] || '',
                    m_name: words.length > 2 ? words.slice(1, -1).join(' ') : '',
                    l_name: words.length > 1 ? words[words.length - 1] : ''
                };
            }
        }

        console.log('⚠️ Name detection unclear, using first line');
        const firstLine = lines[0] || '';
        const words = firstLine.trim().split(/\s+/).filter(w => w.length > 1);
        return {
            f_name: words[0] || '',
            m_name: words.length > 2 ? words.slice(1, -1).join(' ') : '',
            l_name: words.length > 1 ? words[words.length - 1] : ''
        };
    }

    // Extract skills
    extractSkills(text) {
        const lowerText = text.toLowerCase();
        const foundSkills = new Set();

        this.skillKeywords.forEach(skill => {
            const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
            if (regex.test(lowerText)) {
                foundSkills.add(skill);
            }
        });

        const skillsArray = Array.from(foundSkills);
        console.log(`✅ Found ${skillsArray.length} skills: ${skillsArray.slice(0, 10).join(', ')}${skillsArray.length > 10 ? '...' : ''}`);
        return skillsArray;
    }

    // Extract CGPA
    extractCGPA(text) {
        const patterns = [
            /cgpa[\s:]*(\d+\.?\d*)/gi,
            /gpa[\s:]*(\d+\.?\d*)/gi,
            /grade[\s:]*(\d+\.?\d*)/gi,
            /(\d+\.?\d*)[\s]*\/[\s]*10/gi,
            /(\d+\.?\d*)[\s]*cgpa/gi,
            //TABLE
            /bachelor.*?(\d+\.\d+)/gi,
            /b\.?\s*tech.*?(\d+\.\d+)/gi,
            /computer science.*?(\d+\.\d+)/gi

        ];

        for (let pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            for (let match of matches) {
                const value = parseFloat(match[1]);
                if (value >= 0 && value <= 10) {
                    console.log(`✅ Found CGPA: ${value}`);
                    return value;
                }
            }
        }

        // Check for percentage in education section and convert
        const percentPattern = /(?:percentage|%)\s*(\d+\.?\d*)/gi;
        const percentMatches = [...text.matchAll(percentPattern)];
        for (let match of percentMatches) {
            const value = parseFloat(match[1]);
            if (value > 10 && value <= 100) {
                const cgpa = parseFloat((value / 10).toFixed(2));
                console.log(`✅ Found CGPA from percentage: ${cgpa} (${value}%)`);
                return cgpa;
            }
        }

        console.log('⚠️ No CGPA found');
        return null;
    }

    // Extract branch
    extractBranch(text) {
        const lowerText = text.toLowerCase();

        for (let [branch, keywords] of Object.entries(this.branchMappings)) {
            for (let keyword of keywords) {
                if (lowerText.includes(keyword)) {
                    console.log(`✅ Found branch: ${branch} (matched: ${keyword})`);
                    return branch;
                }
            }
        }
        console.log('⚠️ No branch found');
        return null;
    }

    // Extract academic year
    extractAcademicYear(text) {
        // Look for year ranges first (2022-2026, etc.)
        const yearRangePattern = /(20\d{2})\s*[-–—]\s*(20\d{2}|present|pursuing|passout)/gi;
        const rangeMatches = [...text.matchAll(yearRangePattern)];

        for (let match of rangeMatches) {
            const startYear = parseInt(match[1]);
            const endText = match[2].toLowerCase();

            // Check if it's B.Tech/Bachelor context
            const contextBefore = text.substring(Math.max(0, match.index - 200), match.index).toLowerCase();
            const contextAfter = text.substring(match.index, Math.min(text.length, match.index + 200)).toLowerCase();
            const context = contextBefore + contextAfter;

            if (context.includes('bachelor') || context.includes('b.tech') || context.includes('b tech') ||
                context.includes('computer science') || context.includes('engineering')) {

                // If end year is "passout" or a year >= 2024, this is likely the start year
                if (endText === 'passout' || endText === 'pursuing' || endText === 'present' || parseInt(match[2]) >= 2024) {
                    console.log(`✅ Found academic year: ${startYear} (range: ${match[0]})`);
                    return startYear;
                }
            }
        }

        // Fallback patterns
        const patterns = [
            /(?:admitted|admission|joined|enrolled).*?(20\d{2})/gi,
            /batch\s*(?:of)?\s*(20\d{2})/gi
        ];

        for (let pattern of patterns) {
            const matches = [...text.matchAll(pattern)];
            for (let match of matches) {
                const year = parseInt(match[1]);
                if (year >= 2015 && year <= 2025) {
                    console.log(`✅ Found academic year: ${year}`);
                    return year;
                }
            }
        }

        console.log('⚠️ No academic year found');
        return null;
    }

    // Parse complete resume
    async parseResume(filePath) {
        try {
            console.log('\n📄 ========== RESUME PARSING STARTED ==========');
            console.log(`📁 File: ${filePath}`);

            const text = await this.extractText(filePath);

            if (!text || text.length < 50) {
                throw new Error('Extracted text is too short or empty. The PDF may be image-based or corrupted.');
            }

            console.log(`\n📝 Text extracted: ${text.length} characters`);
            console.log('First 300 characters:', text.substring(0, 300));

            console.log('\n🔍 Extracting information...');
            const name = this.extractName(text);
            const skills = this.extractSkills(text);
            const email = this.extractEmail(text);
            const phone = this.extractPhone(text);
            const cgpa = this.extractCGPA(text);
            const branch = this.extractBranch(text);
            const academic_year = this.extractAcademicYear(text);

            console.log('\n✅ ========== EXTRACTION COMPLETE ==========');
            console.log(`Name: ${name.f_name} ${name.m_name} ${name.l_name}`);
            console.log(`Skills: ${skills.length} found`);
            console.log(`CGPA: ${cgpa || 'Not found'}`);
            console.log(`Branch: ${branch || 'Not found'}`);
            console.log(`Year: ${academic_year || 'Not found'}`);
            console.log('==========================================\n');

            return {
                email,
                phone,
                ...name,
                skills,
                cgpa,
                branch,
                academic_year,
                raw_text: text.substring(0, 2000)
            };
        } catch (error) {
            console.error('\n❌ ========== PARSING FAILED ==========');
            console.error('Error:', error.message);
            console.error('==========================================\n');
            throw error;
        }
    }
}

module.exports = ResumeParser;