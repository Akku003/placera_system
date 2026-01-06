import { useState, useEffect } from 'react';
import Layout from '../../components/shared/Layout';
import { adminAPI } from '../../services/api';
import { User, Mail, GraduationCap, Award, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const Candidates = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedCandidates, setSelectedCandidates] = useState([]);

  useEffect(() => {
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      const response = await adminAPI.getCandidates();
      setCandidates(response.data.candidates);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const updatePlacementStatus = async (userId, status) => {
    try {
      await adminAPI.updatePlacementStatus(userId, status);
      toast.success(`Candidate marked as ${status}`);
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedCandidates.length === 0) {
      toast.error('Please select candidates first');
      return;
    }

    try {
      await adminAPI.bulkUpdatePlacementStatus(selectedCandidates, status);
      toast.success(`${selectedCandidates.length} candidates marked as ${status}`);
      setSelectedCandidates([]);
      fetchCandidates();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const toggleSelectCandidate = (userId) => {
    setSelectedCandidates(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const filteredCandidates = filter === 'all'
    ? candidates
    : candidates.filter(c => c.placement_status === filter);

  if (loading) return <Layout><div className="spinner mt-20 mx-auto"></div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold dark:text-white">All Candidates</h1>
        <p className="text-gray-600 dark:text-gray-400">{candidates.length} total candidates</p>
      </div>

      {/* Filters & Bulk Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              All ({candidates.length})
            </button>
            <button
              onClick={() => setFilter('unplaced')}
              className={`px-4 py-2 rounded-lg ${filter === 'unplaced' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              Unplaced ({candidates.filter(c => c.placement_status === 'unplaced').length})
            </button>
            <button
              onClick={() => setFilter('placed')}
              className={`px-4 py-2 rounded-lg ${filter === 'placed' ? 'bg-primary-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
            >
              Placed ({candidates.filter(c => c.placement_status === 'placed').length})
            </button>
          </div>

          {selectedCandidates.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm dark:text-white">{selectedCandidates.length} selected</span>
              <button
                onClick={() => bulkUpdateStatus('placed')}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Mark as Placed
              </button>
              <button
                onClick={() => bulkUpdateStatus('unplaced')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
              >
                Mark as Unplaced
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Candidates List */}
      <div className="space-y-4">
        {filteredCandidates.map((candidate) => (
          <div key={candidate.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => toggleSelectCandidate(candidate.id)}
                  className="mt-1 w-4 h-4"
                />

                <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-white" />
                </div>

                <div className="flex-1">
                  <h3 className="text-lg font-semibold dark:text-white">
                    {candidate.f_name} {candidate.m_name} {candidate.l_name}
                  </h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span className="flex items-center">
                      <Mail size={14} className="mr-1" />
                      {candidate.email}
                    </span>
                    <span>{candidate.register_number}</span>
                    <span>{candidate.branch}</span>
                    {candidate.cgpa && <span>CGPA: {candidate.cgpa}</span>}
                    <span>Backlogs: {candidate.backlogs || 0}</span>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap gap-2">
                      {candidate.skills?.slice(0, 5).map((skill, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {candidate.skills?.length > 5 && (
                        <span className="text-xs text-gray-500">+{candidate.skills.length - 5} more</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center space-x-4 text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      Applications: {candidate.total_applications}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      Selected: {candidate.selected_count}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                {candidate.placement_status === 'placed' ? (
                  <>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-xs font-medium flex items-center">
                      <CheckCircle size={14} className="mr-1" />
                      Placed
                    </span>
                    <button
                      onClick={() => updatePlacementStatus(candidate.id, 'unplaced')}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600"
                    >
                      Mark as Unplaced
                    </button>
                  </>
                ) : (
                  <>
                    <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded-full text-xs font-medium flex items-center">
                      <XCircle size={14} className="mr-1" />
                      Unplaced
                    </span>
                    <button
                      onClick={() => updatePlacementStatus(candidate.id, 'placed')}
                      className="text-xs text-gray-600 dark:text-gray-400 hover:text-green-600"
                    >
                      Mark as Placed
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
};

export default Candidates;