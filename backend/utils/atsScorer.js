class ATSScorer {
  /**
   * Calculate ATS match score between candidate and job
   * @param {Object} candidateProfile - Candidate profile from database
   * @param {Array} candidateSkills - Array of candidate's skills
   * @param {Object} job - Job details with requirements
   * @returns {Object} Detailed matching report with score
   */
  calculateJobMatch(candidateProfile, candidateSkills, job) {
    const report = {
      overall_score: 0,
      eligible: true,
      eligibility_checks: {},
      skills_analysis: {},
      recommendations: [],
      breakdown: {}
    };

    // 1. ELIGIBILITY CHECKS (Pass/Fail - No partial credit)
    report.eligibility_checks = this.checkEligibility(candidateProfile, job);
    report.eligible = report.eligibility_checks.all_passed;

    if (!report.eligible) {
      report.overall_score = 0;
      report.recommendations.push('You do not meet the eligibility criteria for this job');
      return report;
    }

    // 2. SKILLS MATCHING (50% weight)
    const skillsScore = this.calculateSkillsMatch(candidateSkills, job.skills || []);
    report.skills_analysis = skillsScore;
    report.breakdown.skills = skillsScore.score;

    // 3. PROFILE COMPLETENESS (20% weight)
    const completenessScore = this.calculateProfileCompleteness(candidateProfile);
    report.breakdown.profile_completeness = completenessScore.score;
    report.recommendations.push(...completenessScore.recommendations);

    // 4. ACADEMIC PERFORMANCE (30% weight)
    const academicScore = this.calculateAcademicScore(candidateProfile, job);
    report.breakdown.academic_performance = academicScore.score;

    // Calculate weighted overall score
    report.overall_score = Math.round(
      (skillsScore.score * 0.5) +
      (completenessScore.score * 0.2) +
      (academicScore.score * 0.3)
    );

    // Generate recommendations based on score
    if (report.overall_score >= 80) {
      report.recommendations.push('🎉 Excellent match! You are a strong candidate for this position.');
    } else if (report.overall_score >= 60) {
      report.recommendations.push('✅ Good match! Consider applying to this position.');
    } else if (report.overall_score >= 40) {
      report.recommendations.push('⚠️ Moderate match. You may want to upskill before applying.');
    } else {
      report.recommendations.push('❌ Low match. Consider developing relevant skills first.');
    }

    return report;
  }

  checkEligibility(candidateProfile, job) {
    const checks = {
      cgpa_check: { passed: true, message: '' },
      backlogs_check: { passed: true, message: '' },
      branch_check: { passed: true, message: '' },
      all_passed: true
    };

    if (job.min_cgpa && candidateProfile.cgpa) {
      const candidateCGPA = parseFloat(candidateProfile.cgpa);
      const minCGPA = parseFloat(job.min_cgpa);
      
      if (candidateCGPA < minCGPA) {
        checks.cgpa_check.passed = false;
        checks.cgpa_check.message = `Required CGPA: ${minCGPA}, Your CGPA: ${candidateCGPA}`;
        checks.all_passed = false;
      } else {
        checks.cgpa_check.message = `✓ CGPA requirement met (${candidateCGPA} >= ${minCGPA})`;
      }
    }

    if (job.max_backlogs !== null && job.max_backlogs !== undefined) {
      const candidateBacklogs = candidateProfile.backlogs || 0;
      const maxBacklogs = parseInt(job.max_backlogs);
      
      if (candidateBacklogs > maxBacklogs) {
        checks.backlogs_check.passed = false;
        checks.backlogs_check.message = `Maximum backlogs: ${maxBacklogs}, Yours: ${candidateBacklogs}`;
        checks.all_passed = false;
      }
    }

    if (job.allowed_branches && Array.isArray(job.allowed_branches) && job.allowed_branches.length > 0) {
      const candidateBranch = candidateProfile.branch?.toUpperCase().trim();
      const allowedBranches = job.allowed_branches.map(b => b.toUpperCase().trim());
      
      if (!candidateBranch || !allowedBranches.includes(candidateBranch)) {
        checks.branch_check.passed = false;
        checks.branch_check.message = `Allowed: ${job.allowed_branches.join(', ')}, Yours: ${candidateBranch || 'Not specified'}`;
        checks.all_passed = false;
      }
    }

    return checks;
  }

  calculateSkillsMatch(candidateSkills, jobSkills) {
    if (!jobSkills || jobSkills.length === 0) {
      return { score: 70, matching_skills: [], missing_skills: [], match_percentage: 0 };
    }

    const normCandSkills = candidateSkills.map(s => s.toLowerCase().trim());
    const normJobSkills = jobSkills.map(s => s.toLowerCase().trim());

    const matchingSkills = normJobSkills.filter(js =>
      normCandSkills.some(cs => cs.includes(js) || js.includes(cs))
    );

    const missingSkills = normJobSkills.filter(js =>
      !normCandSkills.some(cs => cs.includes(js) || js.includes(cs))
    );

    const matchPct = (matchingSkills.length / normJobSkills.length) * 100;
    let score = matchPct >= 80 ? 100 : matchPct >= 60 ? 80 + (matchPct - 60) : matchPct;

    return {
      score: Math.round(score),
      matching_skills: matchingSkills,
      missing_skills: missingSkills,
      match_percentage: Math.round(matchPct)
    };
  }

  calculateProfileCompleteness(profile) {
    const required = ['f_name', 'l_name', 'email', 'register_number', 'cgpa', 'branch', 'academic_year'];
    const filled = required.filter(f => profile[f] !== null && profile[f] !== undefined && profile[f] !== '');
    const missing = required.filter(f => !filled.includes(f));

    return {
      score: Math.round((filled.length / required.length) * 100),
      missing_fields: missing,
      recommendations: missing.length > 0 ? [`Complete profile: ${missing.join(', ')}`] : []
    };
  }

  calculateAcademicScore(profile, job) {
    let score = 50;
    if (profile.cgpa) {
      const cgpa = parseFloat(profile.cgpa);
      if (cgpa >= 9.0) score += 40;
      else if (cgpa >= 8.5) score += 35;
      else if (cgpa >= 8.0) score += 30;
      else if (cgpa >= 7.5) score += 25;
      else score += 15;
    }
    if ((profile.backlogs || 0) === 0) score += 10;
    return { score: Math.min(score, 100), cgpa: profile.cgpa, backlogs: profile.backlogs || 0 };
  }
}

module.exports = ATSScorer;