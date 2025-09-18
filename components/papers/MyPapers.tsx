'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FilePlus } from 'lucide-react';
import PaperCard from './PaperCard';
import AuthModal from '@/components/auth/AuthModal';
import { useAuth } from '@/components/auth/AuthContext';
import { Paper, setValues } from './types';

const MyPapers = () => {
  const { isLoggedIn, userId, loading } = useAuth();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      setIsModalOpen(!isLoggedIn);
    }
  }, [isLoggedIn, loading]);

  useEffect(() => {
    if (isLoggedIn && userId) {
      fetchUserPapers();
    }
  }, [isLoggedIn, userId]);

  const fetchUserPapers = async () => {
    if (!userId) {
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/papers`);
      if (!response.ok) {
        throw new Error('Failed to fetch papers');
      }
      const data = await response.json();
      setPapers(data.papers ?? []);
      setError(null);
    } catch (error) {
      console.error('Error fetching papers:', error);
      setError('Error fetching papers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (paper: Paper) => {
    setPapers((prev) => prev.filter((p) => p.doi !== paper.doi));

    try {
      const response = await fetch('/api/remove-one-paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          doi: paper.doi,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error removing paper:', data.message);
        await fetchUserPapers();
      }
    } catch (error) {
      console.error('Error removing paper:', error);
      await fetchUserPapers();
    }
  };

  const handleCloseLoginModal = () => {
    setIsModalOpen(false);
    router.push('/');
  };

  const renderContent = () => {
    if (isLoading || loading) {
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

    if (papers.length === 0) {
      return (
        <div className="text-center text-gray-600 py-12 flex flex-col items-center">
          <FilePlus className="h-8 w-8 mb-4 text-blue-500" />
          <p className="text-xl">No To-Read papers now, please add one paper on the Index page.</p>
        </div>
      );
    }

    return papers.map((paper) => {
      const normalisedPaper: Paper = { ...paper };
      setValues(normalisedPaper);
      return (
        <PaperCard
          key={paper.doi}
          paper={normalisedPaper}
          handleSave={() => {}}
          handleRemove={handleRemove}
          showSaveButton={false}
          showRemoveIcon={true}
          userId={userId}
        />
      );
    });
  };

  return (
    <div>
      {!isLoggedIn ? (
        <AuthModal isOpen={isModalOpen} onClose={handleCloseLoginModal} />
      ) : (
        <div className="min-h-screen flex justify-center items-center">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10">
            <div className="text-2xl font-semibold text-center mb-6">My To-Read List</div>
            <div className="space-y-6">{renderContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPapers;
