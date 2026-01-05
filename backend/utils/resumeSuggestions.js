class ResumeSuggestions {
  
  generateSuggestions(parsedData, candidateProfile) {
    const suggestions = [];
    const warnings = [];
    const missing = [];
    
    // Check CGPA
    if (!parsedData.cgpa && !candidateProfile.cgpa) {
      missing.push('CGPA/GPA');
      suggestions.push({
        field: 'CGPA',
        issue: 'CGPA not found in resume',
        suggestion: 'Add your CGPA clearly in the education section (e.g., "CGPA: 8.09/10" or "Grade: 8.09")',
        impact: 'high',
        priority: 1
      });
    }
    
    // Check Academic Year
    if (!parsedData.academic_year && !candidateProfile.academic_year) {
      missing.push('Academic Year');
      suggestions.push({
        field: 'Academic Year',
        issue: 'Year of admission not found',
        suggestion: 'Clearly mention your admission year (e.g., "Bachelor of Technology (2022-2026)" or "Batch of 2022")',
        impact: 'high',
        priority: 2
      });
    }
    
    // Check Skills
    if (!parsedData.skills || parsedData.skills.length < 5) {
      warnings.push('Limited technical skills detected');
      suggestions.push({
        field: 'Skills',
        issue: `Only ${parsedData.skills?.length || 0} skills detected`,
        suggestion: 'Add a dedicated "Technical Skills" or "Skills" section with relevant technologies, programming languages, and tools',
        impact: 'high',
        priority: 3
      });
    }
    
    // Check Register Number
    if (!parsedData.register_number && !candidateProfile.register_number) {
      warnings.push('Register number not found (but can be entered during registration)');
    }
    
    // Check Phone
    if (!parsedData.phone) {
      missing.push('Phone Number');
      suggestions.push({
        field: 'Contact',
        issue: 'Phone number not detected',
        suggestion: 'Add your phone number in the contact section clearly (e.g., "+91-1234567890" or "Phone: 1234567890")',
        impact: 'medium',
        priority: 4
      });
    }
    
    // Check Email
    if (!parsedData.email) {
      missing.push('Email');
      suggestions.push({
        field: 'Contact',
        issue: 'Email not detected',
        suggestion: 'Add your professional email address in the contact section',
        impact: 'high',
        priority: 5
      });
    }
    
    // Skills quality check
    if (parsedData.skills && parsedData.skills.length >= 5 && parsedData.skills.length < 10) {
      suggestions.push({
        field: 'Skills',
        issue: 'Good skill count but could be improved',
        suggestion: 'Consider adding more relevant skills like frameworks, databases, or tools you know',
        impact: 'low',
        priority: 6
      });
    }
    
    // Calculate ATS score
    const atsReadiness = this.calculateATSReadiness(parsedData, candidateProfile);
    
    return {
      atsReadiness,
      missing,
      warnings,
      suggestions: suggestions.sort((a, b) => a.priority - b.priority),
      summary: this.generateSummary(atsReadiness, missing.length, warnings.length)
    };
  }
  
  calculateATSReadiness(parsedData, candidateProfile) {
    let score = 0;
    let maxScore = 100;
    
    // Contact Information (20 points)
    if (parsedData.email) score += 10;
    if (parsedData.phone) score += 10;
    
    // Education Details (30 points)
    if (parsedData.cgpa || candidateProfile.cgpa) score += 15;
    if (parsedData.academic_year || candidateProfile.academic_year) score += 10;
    if (parsedData.branch || candidateProfile.branch) score += 5;
    
    // Skills (40 points)
    if (parsedData.skills) {
      if (parsedData.skills.length >= 15) score += 40;
      else if (parsedData.skills.length >= 10) score += 30;
      else if (parsedData.skills.length >= 5) score += 20;
      else score += 10;
    }
    
    // Name (10 points)
    if (parsedData.f_name && parsedData.l_name) score += 10;
    
    const percentage = Math.round((score / maxScore) * 100);
    
    return {
      score,
      maxScore,
      percentage,
      rating: this.getRating(percentage)
    };
  }
  
  getRating(percentage) {
    if (percentage >= 90) return { level: 'Excellent', color: 'green', emoji: '🌟' };
    if (percentage >= 75) return { level: 'Good', color: 'blue', emoji: '✅' };
    if (percentage >= 60) return { level: 'Fair', color: 'orange', emoji: '⚠️' };
    return { level: 'Needs Improvement', color: 'red', emoji: '❌' };
  }
  
  generateSummary(atsReadiness, missingCount, warningsCount) {
    const { percentage, rating } = atsReadiness;
    
    let summary = `Your resume is ${rating.level.toLowerCase()} for ATS systems (${percentage}%). `;
    
    if (missingCount > 0) {
      summary += `${missingCount} critical field${missingCount > 1 ? 's are' : ' is'} missing. `;
    }
    
    if (warningsCount > 0) {
      summary += `There ${warningsCount > 1 ? 'are' : 'is'} ${warningsCount} area${warningsCount > 1 ? 's' : ''} that could be improved. `;
    }
    
    if (percentage >= 90) {
      summary += 'Great job! Your resume is well-optimized for ATS.';
    } else if (percentage >= 75) {
      summary += 'Your resume is good but there\'s room for improvement.';
    } else {
      summary += 'Consider updating your resume with the suggested improvements.';
    }
    
    return summary;
  }
}

module.exports = ResumeSuggestions;