import React, { useState, useEffect } from "react";
import axios from "axios";
import { FilePlus } from 'lucide-react';
import PaperCard from "./PaperCard";
import AuthModal from "./AuthModal";  // Ensure this is correctly imported
import { useNavigate } from "react-router-dom";  // Import useNavigate
import {Paper, setValues} from './Paper'

const MyPapers: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [userId, setUserId] = useState<number | null>(null); // To store the logged-in user's ID
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);  // Modal visibility state
  
  const navigate = useNavigate();

  // Fetch user login status from Flask on component mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const response = await axios.post("/login");
        
        if (response.status === 200 && response.data.userId) {
          setIsLoggedIn(true);
          setUserId(response.data.userId);  // Set user ID
        } else {
          setIsLoggedIn(false);
          setIsModalOpen(true)
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        setError("Error checking login status");
      }
    };

    checkLoginStatus();
  }, []); // Run only once when the component mounts

  useEffect(() => {
    // Fetch user papers only if userId is set and user is logged in
    if (isLoggedIn && userId) {
      fetchUserPapers();
    }
  }, [isLoggedIn, userId]); // This will run when `isLoggedIn` or `userId` changes

  // Fetch user papers from Flask backend
  const fetchUserPapers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`/${userId}/papers/`);
      if (response.status === 200) {
        setPapers(response.data.papers);  // Set the fetched papers
      } else {
        setError("Failed to fetch papers");
      }
    } catch (error) {
      console.error("Error fetching papers:", error);
      setError("Error fetching papers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (paper: Paper) => {
    {
      // Remove the paper from the list
      setPapers(papers.filter(p => p.link !== paper.link));
      
      fetch('/remove_one_paper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          doi: paper.doi,
        }),
      })
        .then(response => response.json())
        .then(data => {
          console.log('Paper removed successfully');
        })
        .catch(err => {
          console.error('Error removing paper:', err);
        });
    }
  };
  

  const handleCloseLoginModal = () => {
    setIsModalOpen(false);
    navigate("/");

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

    if (papers.length === 0) {
      return (
        <div className="text-center text-gray-600 py-12 flex flex-col items-center">
          <FilePlus className="h-8 w-8 mb-4 text-blue-500" />
          <p className="text-xl">No To-Read papers now, please add one paper on the Index page.</p>
        </div>
      );
    }
  
    return papers.map((paper, index) => {
      setValues(paper);
      return (
        <PaperCard 
          key={index} 
          paper={paper} 
          handleSave={() => {}} 
          handleRemove={() => handleRemove(paper)} 
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
        // If not logged in, show the login modal
        <AuthModal
          isOpen={isModalOpen}
          onClose={handleCloseLoginModal}
        />
      ) : (
        <div className="pt-[calc(4rem+1px)] min-h-screen bg-gradient-to-r from-gray-100 to-gray-200 p-6 flex justify-center items-center relative">
          <div className="w-full max-w-4xl bg-white rounded-2xl shadow-lg p-10">
            <div className="text-2xl font-semibold text-center mb-6">
              My To-Read List
            </div>
            
            <div className="space-y-6">{renderContent()}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPapers;
