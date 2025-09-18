import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import PaperCard from './PaperCard'; 
import AuthModal from './AuthModal';
import { useAuth } from './AuthContext'; // Import the custom hook for auth context
import {Paper} from './Paper'
import { showError, showSuccess } from './ShowMsg';

const PaperSearch = () => {
  // Load state from localStorage or set default values
  const storedKeyword = localStorage.getItem('keyword') || '';
  const storedMaxResults = Number(localStorage.getItem('maxResults') || '10');
  const storedPapers = localStorage.getItem('papers');
  const initialPapers = storedPapers ? JSON.parse(storedPapers) : [];

  const [keyword, setKeyword] = useState(storedKeyword);
  const [maxResults, setMaxResults] = useState(storedMaxResults);
  const [papers, setPapers] = useState<Paper[]>(initialPapers);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false); // Track login modal visibility
  
  const { isLoggedIn } = useAuth(); // Get login state and set function from context

  const [isModalOpen, setIsModalOpen] = useState(false); 

  useEffect(() => {
    // Store the values of keyword, maxResults, and papers in localStorage
    localStorage.setItem('keyword', keyword);
    localStorage.setItem('maxResults', String(maxResults));
    localStorage.setItem('papers', JSON.stringify(papers));
  }, [keyword, maxResults, papers]); // These values will be updated in localStorage whenever they change

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setPapers([]);
    setError(null);

    try {
      const response = await fetch('/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `keyword=${encodeURIComponent(keyword)}&max_results=${maxResults}`,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: Paper[] = await response.json();
      setPapers(data);
      setIsLoading(false);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleSave = async (paper: Paper) => {
    if (!isLoggedIn) {
      setShowLoginModal(true); // Show login modal if not logged in
      return;
    }

    const doi = paper.link.split('/').pop();  
    try {
      const response = await fetch('/save_paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper_title: paper.title,
          doi: doi,
          paper_link: paper.link,
          status: 'pending',
          author: paper.first_author,
          published: paper.published,
        }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to save the paper.');
      }
  
      showSuccess('Paper saved to your To-Read list.');
    } catch (error) {
      showError('Paper already saved before!');
    }
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-500"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center text-red-500 py-12">
          <p className="text-xl">Error: {error}</p>
        </div>
      );
    }

    return papers.map((paper, index) => (
      <PaperCard
        key={index}
        paper={paper}
        handleSave={handleSave}
        handleRemove={() => (null)} 
        showSaveButton={true}
        showRemoveIcon={false}
      />
    ));
    
  };

  return (
    <div className="pt-[calc(4rem+1px)] min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-6 flex justify-center items-center relative">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10">
        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-8">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter research topic (e.g., AI security)"
              className="flex-grow p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition"
              required
            />
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 transition"
            >
              <option value={10}>10 Results</option>
              <option value={20}>20 Results</option>
              <option value={50}>50 Results</option>
              <option value={100}>100 Results</option>
              <option value={200}>200 Results</option>
            </select>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-6 rounded-lg font-bold hover:scale-105 transform transition duration-300 flex items-center justify-center"
            >
              <Search className="mr-2 h-5 w-5" />
              Search
            </button>
          </div>
        </form>

        <div className="space-y-6">{renderContent()}</div>
      </div>

      <AuthModal
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default PaperSearch;
