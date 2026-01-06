class ATSScorer {
  /**
   * Calculate ATS match score between candidate and job
   * @param {Object} candidateProfile - Candidate profile from database
   * @param {Array} candidateSkills - Array of candidate's skills
   * @param {Object} job - Job details with requirements
   * @returns {Object} Detailed matching report with score
   */
  calculateJobMatch(candidateProfile, candidateSkills, job) {
  console.log('\n=== ATS SCORER DEBUG ===');
  console.log('Candidate Profile:', candidateProfile);
  console.log('Candidate Skills:', candidateSkills);
  console.log('Job Requirements:', job);

  // Calculate skill match
  const requiredSkills = job.skills || [];
  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach(reqSkill => {
    const matched = candidateSkills.some(candSkill => 
      candSkill.toLowerCase().includes(reqSkill.toLowerCase()) ||
      reqSkill.toLowerCase().includes(candSkill.toLowerCase())
    );
    
    if (matched) {
      matchedSkills.push(reqSkill);
    } else {
      missingSkills.push(reqSkill);
    }
  });

  const skillsScore = requiredSkills.length > 0 
    ? (matchedSkills.length / requiredSkills.length) * 100 
    : 0;

  // Calculate profile completeness
  let profileScore = 0;
  if (candidateProfile.f_name) profileScore += 20;
  if (candidateProfile.email) profileScore += 20;
  if (candidateProfile.cgpa) profileScore += 20;
  if (candidateProfile.branch) profileScore += 20;
  if (candidateSkills.length >= 5) profileScore += 20;

  // Calculate academic score
  let academicScore = 0;
  if (candidateProfile.cgpa) {
    const cgpa = parseFloat(candidateProfile.cgpa);
    if (cgpa >= 9.0) academicScore = 100;
    else if (cgpa >= 8.0) academicScore = 90;
    else if (cgpa >= 7.0) academicScore = 80;
    else if (cgpa >= 6.0) academicScore = 70;
    else academicScore = 60;
  }

  // Check eligibility
  const eligibilityChecks = this.checkEligibility(candidateProfile, job);

  // Calculate final ATS score
  const atsScore = (skillsScore * 0.5) + (profileScore * 0.3) + (academicScore * 0.2);

  const result = {
    ats_score: Math.round(atsScore),
    skills_score: Math.round(skillsScore),
    profile_score: Math.round(profileScore),
    academic_score: Math.round(academicScore),
    matched_skills: matchedSkills,
    missing_skills: missingSkills,
    total_required_skills: requiredSkills.length,
    eligible: eligibilityChecks.eligible,
    eligibility_checks: eligibilityChecks
  };

  console.log('ATS Result:', result);
  console.log('=======================\n');

  return result;
}

  checkEligibility(candidateProfile, job) {
    const checks = {
      cgpa_met: true,
      backlogs_met: true,
      branch_allowed: true,
      placed_status: true,
      reasons: []
    };

    // Check if student is already placed
    if (candidateProfile && candidateProfile.placement_status === 'placed') {
      checks.placed_status = false;
      checks.reasons.push('Student is already placed and cannot apply for more positions');
    }

    // Check CGPA
    if (job.min_cgpa && candidateProfile && candidateProfile.cgpa < job.min_cgpa) {
      checks.cgpa_met = false;
      checks.reasons.push(`CGPA ${candidateProfile.cgpa} is below required ${job.min_cgpa}`);
    }

    // Check backlogs
    if (job.max_backlogs !== null && candidateProfile && candidateProfile.backlogs > job.max_backlogs) {
      checks.backlogs_met = false;
      checks.reasons.push(`Current backlogs (${candidateProfile.backlogs}) exceed maximum allowed (${job.max_backlogs})`);
    }

    // Check branch
    if (job.allowed_branches && job.allowed_branches.length > 0) {
      if (candidateProfile && !job.allowed_branches.includes(candidateProfile.branch)) {
        checks.branch_allowed = false;
        checks.reasons.push(`Branch ${candidateProfile.branch} is not in allowed branches: ${job.allowed_branches.join(', ')}`);
      }
    }

    checks.eligible = checks.cgpa_met && checks.backlogs_met && checks.branch_allowed && checks.placed_status;

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