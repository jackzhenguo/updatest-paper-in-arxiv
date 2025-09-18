'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import PaperCard from './PaperCard';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';
import { Paper } from './types';
import { showError, showSuccess } from '@/components/shared/ShowMsg';

const PaperSearch = () => {
  const { isLoggedIn } = useAuth();

  const [keyword, setKeyword] = useState('');
  const [maxResults, setMaxResults] = useState(10);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const storedKeyword = window.localStorage.getItem('keyword');
    const storedMaxResults = window.localStorage.getItem('maxResults');
    const storedPapers = window.localStorage.getItem('papers');

    if (storedKeyword) {
      setKeyword(storedKeyword);
    }
    if (storedMaxResults) {
      setMaxResults(Number(storedMaxResults));
    }
    if (storedPapers) {
      try {
        setPapers(JSON.parse(storedPapers));
      } catch (parseError) {
        console.warn('Failed to parse stored papers:', parseError);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem('keyword', keyword);
    window.localStorage.setItem('maxResults', String(maxResults));
    window.localStorage.setItem('papers', JSON.stringify(papers));
  }, [keyword, maxResults, papers]);

  const handleSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setPapers([]);
    setError(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword, maxResults }),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data: Paper[] = await response.json();
      setPapers(data);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (paper: Paper) => {
    if (!isLoggedIn) {
      setIsModalOpen(true);
      return;
    }

    const doi = paper.doi || paper.link.split('/').pop() || '';
    try {
      const response = await fetch('/api/save-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paper_title: paper.title,
          doi,
          paper_link: paper.link,
          status: 'pending',
          author: paper.first_author,
          published: paper.published,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        showError(data.message ?? 'Failed to save the paper.');
        return;
      }

      showSuccess(data.message ?? 'Paper saved to your To-Read list.');
    } catch (error) {
      console.error('Error saving paper:', error);
      showError('Paper already saved before!');
    }
  };

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
        key={`${paper.doi}-${index}`}
        paper={paper}
        handleSave={handleSave}
        handleRemove={() => undefined}
        showSaveButton={true}
        showRemoveIcon={false}
      />
    ));
  };

  return (
    <div className="min-h-screen flex justify-center items-center">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10">
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

      <AuthModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default PaperSearch;
