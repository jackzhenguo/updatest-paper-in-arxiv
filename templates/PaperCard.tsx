import React, { useState } from 'react';
import { Calendar, ExternalLink, Heart, CheckCircle, PauseCircle, XCircle, Clock, Loader, Star } from 'lucide-react';
import StarRating from './StarRating';

type PaperCardProps = {
  paper: {
    title: string;
    published: string;
    created_at: string;
    updated_at?: string;
    in_process_at?: string;
    done_at?: string;
    first_author: string;
    author_affiliation?: string;
    summary: string;
    link: string;
    doi: string;
    status: 'pending' | 'in_progress' | 'completed';
    progress?: number;
    rating?: number;
  };
  userId?: number | null; //only having value in /mypapers page
  handleSave: (paper: any) => void;
  handleRemove: (paper: any) => void;
  showSaveButton: boolean;
  showRemoveIcon: boolean;
};

const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  handleSave,
  handleRemove,
  showSaveButton,
  showRemoveIcon,
  userId
}) => {
  const [status, setStatus] = useState(paper.status);
  const [rating, setRating] = useState<number>(paper.rating || 0); // Initialize rating state

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in_progress':
        return 'bg-blue-400';
      case 'completed':
        return 'bg-green-400';
      default:
        return 'bg-gray-400';
    }
  };

  const toggleStatus = async () => {
    const newStatus =
      status === 'pending' ? 'in_progress' : status === 'in_progress' ? 'completed' : 'pending';
    setStatus(newStatus);

    // Send the updated status to the Flask backend
    try {
      const response = await fetch('/update_status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          doi: paper.doi,
          status: newStatus
        })
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Status updated successfully:', result);
      } else {
        console.error('Error updating status:', result.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleStatusClick = () => {
    toggleStatus();
  };

  const handleRemoveClick = async () => {
    if (window.confirm('Are you sure you want to remove this paper from your To-Read list?')) {
      handleRemove(paper);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);

    // Send the updated rating to the Flask backend
    try {
      const response = await fetch('/update_rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userId,
          doi: paper.doi,
          rating: newRating
        })
      });

      const result = await response.json();
      if (response.ok) {
        console.log('Rating updated successfully:', result);
      } else {
        console.error('Error updating rating:', result.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-105 transition-transform duration-300 mb-6">
      <h2 className="font-bold text-lg mb-2 text-blue-700 hover:text-blue-900">{paper.title}</h2>

      <div className="flex items-center text-sm text-gray-600 mb-2 gap-x-2">
        <Calendar className="h-4 w-4" />
        <span>{new Date(paper.published).toLocaleDateString()}</span>

        <span className="font-semibold">{paper.first_author}</span>

        {paper.author_affiliation && paper.author_affiliation !== 'No affiliation listed' && (
          <span className="text-gray-600">{`(${paper.author_affiliation})`}</span>
        )}

        {paper.created_at && (
          <>
            <Clock className="h-4 w-4" />
            <span>Pending: {new Date(paper.created_at).toLocaleDateString()}</span>
          </>
        )}

        {paper.in_process_at && (
          <>
            <Loader className="h-4 w-4" />
            <span>Processing: {new Date(paper.in_process_at).toLocaleDateString()}</span>
          </>
        )}

        {paper.done_at && (
          <>
            <CheckCircle className="h-4 w-4" />
            <span>Completed: {new Date(paper.done_at).toLocaleDateString()}</span>
          </>
        )}
      </div>

      <p className="text-gray-700 mb-3 line-clamp-3">{paper.summary}</p>

      <div className="flex items-center justify-between">
        <a
          href={paper.link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center text-blue-600 hover:text-blue-800 font-semibold transition duration-300"
          aria-label="View full paper"
        >
          <ExternalLink className="mr-2 h-4 w-4" />
          View Full Paper
        </a>

        <div className="flex items-center space-x-4">
          {/* Status Icon and Text */}
          <button
            onClick={handleStatusClick}
            className={`flex items-center space-x-2 ${getStatusColor()} px-4 py-1 rounded-full text-white`}
            aria-label="Change Status"
          >
            {status === 'pending' && <PauseCircle className="h-5 w-5" />}
            {status === 'in_progress' && <CheckCircle className="h-5 w-5" />}
            {status === 'completed' && <CheckCircle className="h-5 w-5" />}
            <span>{status && (status.charAt(0).toUpperCase() + status.slice(1))}</span>
          </button>

          {/* Rating */}
          {showRemoveIcon && (
            <div className="flex items-center space-x-2">
            <span className="text-gray-600">Love:</span>
            <StarRating rating={rating} onRatingChange={handleRatingChange} />
          </div>
          )}

          {/* Remove Icon */}
          {showRemoveIcon && (
            <button
              onClick={handleRemoveClick}
              className="text-red-600 hover:text-red-800 flex items-center space-x-2"
              aria-label="Remove Paper"
            >
              <XCircle className="h-5 w-5" />
              <span>Remove</span>
            </button>
          )}

          {/* Conditionally render the "Add to reading list" button */}
          {showSaveButton && (
            <button
              onClick={() => handleSave(paper)}
              className="text-gray-600 hover:text-gray-800 flex items-center space-x-2"
              aria-label="Add to reading list"
            >
              <Heart className="h-5 w-5" />
              <span>Add To-Read</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaperCard;
