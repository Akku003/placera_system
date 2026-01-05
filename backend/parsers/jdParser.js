const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const fs = require('fs');

class JDParser {
  constructor() {
    // Same skill keywords as resume parser
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
      'data structures', 'algorithms', 'oop', 'object-oriented programming'
    ]);
  }

  // Extract text from PDF
  async extractTextFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error('Failed to parse JD PDF: ' + error.message);
    }
  }

  // Extract text from DOCX
  async extractTextFromDOCX(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch (error) {
      throw new Error('Failed to parse JD DOCX: ' + error.message);
    }
  }

  // Extract text
  async extractText(filePath) {
    const ext = filePath.toLowerCase();
    if (ext.endsWith('.pdf')) {
      return await this.extractTextFromPDF(filePath);
    } else if (ext.endsWith('.docx')) {
      return await this.extractTextFromDOCX(filePath);
    } else {
      throw new Error('Unsupported file format');
    }
  }

  // Extract skills from JD
  extractSkills(text) {
    const lowerText = text.toLowerCase();
    const foundSkills = new Set();

    this.skillKeywords.forEach(skill => {
      const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      if (regex.test(lowerText)) {
        foundSkills.add(skill);
      }
    });

    return Array.from(foundSkills);
  }

  // Extract minimum CGPA
  extractMinCGPA(text) {
    const patterns = [
      /(?:minimum|min|required)[\s]+(?:cgpa|gpa)[\s:]*(\d+\.?\d*)/gi,
      /cgpa[\s:]*(?:of|>=|>|above)[\s]*(\d+\.?\d*)/gi,
      /(\d+\.?\d*)[\s]*(?:cgpa|gpa)[\s]+(?:and above|or above|minimum|required)/gi
    ];
    
    for (let pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (let match of matches) {
        const value = parseFloat(match[1]);
        if (value >= 0 && value <= 10) {
          console.log(`✅ Found min CGPA: ${value}`);
          return value;
        }
      }
    }
    
    console.log('⚠️ No minimum CGPA found');
    return null;
  }

  // Extract maximum backlogs
  extractMaxBacklogs(text) {
    // Check for "no backlogs" requirement
    const noBacklogPatterns = [
      /(?:no|zero|0)[\s]+(?:active[\s]+)?backlogs?/gi,
      /backlogs?[\s:]*(?:no|zero|0|not allowed|nil)/gi
    ];
    
    for (let pattern of noBacklogPatterns) {
      if (pattern.test(text)) {
        console.log('✅ Found: No backlogs allowed (0)');
        return 0;
      }
    }
    
    // Check for specific number
    const backlogNumPatterns = [
      /(?:maximum|max|up to)[\s]+(\d+)[\s]+backlogs?/gi,
      /(\d+)[\s]+backlogs?[\s]+(?:allowed|acceptable|maximum|max)/gi
    ];
    
    for (let pattern of backlogNumPatterns) {
      const matches = [...text.matchAll(pattern)];
      for (let match of matches) {
        const value = parseInt(match[1]);
        if (value >= 0 && value <= 10) {
          console.log(`✅ Found max backlogs: ${value}`);
          return value;
        }
      }
    }
    
    console.log('⚠️ No backlog requirement found (allowing all)');
    return null;
  }

  // Extract allowed branches
  extractBranches(text) {
    const branches = new Set();
    const branchKeywords = {
      'CSE': ['computer science', 'cs', 'cse', 'computer engineering'],
      'ECE': ['electronics', 'ece', 'electronics and communication'],
      'EEE': ['electrical', 'eee', 'electrical engineering'],
      'MECH': ['mechanical', 'mech', 'mechanical engineering'],
      'CIVIL': ['civil', 'civil engineering'],
      'IT': ['information technology', 'it', 'information science']
    };

    const lowerText = text.toLowerCase();
    
    for (let [branch, keywords] of Object.entries(branchKeywords)) {
      for (let keyword of keywords) {
        if (lowerText.includes(keyword)) {
          branches.add(branch);
          break;
        }
      }
    }

    const result = Array.from(branches);
    if (result.length > 0) {
      console.log(`✅ Found branches: ${result.join(', ')}`);
    } else {
      console.log('⚠️ No branch restrictions found (open to all)');
    }
    
    return result.length > 0 ? result : null;
  }

  // Extract package (salary)
  extractPackage(text) {
    const patterns = [
      /(?:package|ctc|salary|compensation)[\s:]*(?:inr|rs\.?|₹)?[\s]*(\d+(?:\.\d+)?)[\s]*(?:lpa|lakhs?|l)/gi,
      /(?:inr|rs\.?|₹)?[\s]*(\d+(?:\.\d+)?)[\s]*(?:lpa|lakhs?)[\s]*(?:per annum|ctc|package)/gi
    ];
    
    for (let pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (let match of matches) {
        const value = parseFloat(match[1]);
        if (value >= 1 && value <= 100) {
          console.log(`✅ Found package: ${value} LPA`);
          return value;
        }
      }
    }
    
    console.log('⚠️ No package information found');
    return null;
  }

  // Parse complete JD
  async parseJD(filePath) {
    try {
      console.log('\n📄 ========== JD PARSING STARTED ==========');
      console.log(`📁 File: ${filePath}`);
      
      const text = await this.extractText(filePath);
      console.log(`📝 JD text extracted: ${text.length} characters`);
      
      const skills = this.extractSkills(text);
      const min_cgpa = this.extractMinCGPA(text);
      const max_backlogs = this.extractMaxBacklogs(text);
      const allowed_branches = this.extractBranches(text);
      const package_lpa = this.extractPackage(text);
      
      console.log('\n✅ ========== JD EXTRACTION COMPLETE ==========');
      console.log(`Skills: ${skills.length} found`);
      console.log(`Min CGPA: ${min_cgpa || 'Not specified'}`);
      console.log(`Max Backlogs: ${max_backlogs !== null ? max_backlogs : 'Not specified'}`);
      console.log(`Branches: ${allowed_branches ? allowed_branches.join(', ') : 'All branches'}`);
      console.log(`Package: ${package_lpa ? package_lpa + ' LPA' : 'Not specified'}`);
      console.log('==========================================\n');
      
      return {
        skills,
        min_cgpa,
        max_backlogs,
        allowed_branches,
        package_lpa,
        description: text.substring(0, 1000)
      };
    } catch (error) {
      console.error('❌ JD parsing failed:', error);
      throw error;
    }
  }
}

module.exports = JDParser;