import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import { BookOpen } from 'lucide-react'; 
import PaperSearch from './PaperSearch';
import MyPapers from './MyPapers';
import { useAuth } from './AuthContext';  
import { showSuccess } from './ShowMsg';


const App: React.FC = () => {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();

  const handleIndexClick = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    navigate('/my-papers');
  };

  return (
    <div className="App">
      {/* Main Container for Header and Buttons */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 ">
        {/* Left-aligned content: Icon and Header */}
        <div className="flex items-center space-x-4">
          <BookOpen className="h-12 w-12 text-blue-500" />
          <h1 className="text-lg font-bold">Paper Assistant</h1>
        </div>
        {/* <button onClick={() => showSuccess("This is a success message!")}>Show Success</button> */}
        {/* Center-aligned Buttons */}
        <div className="flex space-x-4">
          <button
            onClick={handleIndexClick}
            className="bg-gray-600 text-white px-4 py-2 rounded-full hover:bg-gray-700 transition"
          >
            Index
          </button>
          <button
            onClick={handleProfileClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
          >
            {isLoggedIn ? "Me" : "Login"}
          </button>
        </div>
      </div>
      {/* Define Routes here */}
      <Routes>
        <Route path="/" element={<PaperSearch />} />
        <Route path="/my-papers" element={<MyPapers />} />
      </Routes>
    </div>
  );
};

export default App;
