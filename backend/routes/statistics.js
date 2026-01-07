const express = require('express');
const router = express.Router();

// Placement statistics data (processed from Excel)
const placementStatistics = {
  summary: {
    total_students_placed: 956,
    total_company_visits: 74,
    years_covered: ['2020', '2021', '2022', '2023', '2024'],
    average_per_year: 191.2,
    estimated_success_rate: 47.8
  },
  yearly_stats: {
    '2020': { total_placements: 333, num_companies: 25 },
    '2021': { total_placements: 298, num_companies: 24 },
    '2022': { total_placements: 325, num_companies: 25 },
    '2023': { total_placements: 0, num_companies: 0 },
    '2024': { total_placements: 0, num_companies: 0 }
  },
  top_recruiters: [
    { name: 'ACCENTURE', total_placements: 119, years_recruited: 3 },
    { name: 'INFOSYS', total_placements: 118, years_recruited: 3 },
    { name: 'COGNIZANT', total_placements: 107, years_recruited: 3 },
    { name: 'DXC TECHNOLOGIES', total_placements: 55, years_recruited: 1 },
    { name: 'EY', total_placements: 49, years_recruited: 3 },
    { name: 'TCS', total_placements: 46, years_recruited: 3 },
    { name: 'UST GLOBAL', total_placements: 32, years_recruited: 2 },
    { name: 'WIPRO', total_placements: 25, years_recruited: 2 },
    { name: 'VVDN', total_placements: 25, years_recruited: 1 },
    { name: 'ENVESTNET', total_placements: 24, years_recruited: 3 }
  ]
};

// Public endpoint - no authentication required
router.get('/stats', (req, res) => {
  res.json({
    success: true,
    data: placementStatistics
  });
});

// Get summary stats only (for landing page)
router.get('/summary', (req, res) => {
  res.json({
    success: true,
    data: placementStatistics.summary
  });
});

// Get year-wise trends
router.get('/trends', (req, res) => {
  const trends = Object.entries(placementStatistics.yearly_stats).map(([year, data]) => ({
    year,
    placements: data.total_placements,
    companies: data.num_companies
  }));

  res.json({
    success: true,
    data: trends
  });
});

// Get top recruiters
router.get('/top-recruiters', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  
  res.json({
    success: true,
    data: placementStatistics.top_recruiters.slice(0, limit)
  });
});

module.exports = router;