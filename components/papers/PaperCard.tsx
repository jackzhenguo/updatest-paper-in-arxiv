'use client';

import { useState } from 'react';
import {
  Calendar,
  ExternalLink,
  Heart,
  CheckCircle,
  PauseCircle,
  XCircle,
  Clock,
  Loader,
} from 'lucide-react';
import StarRating from '@/components/shared/StarRating';
import { Paper, PaperStatus } from './types';

interface PaperCardProps {
  paper: Paper;
  userId?: number | null;
  handleSave: (paper: Paper) => void;
  handleRemove: (paper: Paper) => void;
  showSaveButton: boolean;
  showRemoveIcon: boolean;
}

const PaperCard = ({
  paper,
  handleSave,
  handleRemove,
  showSaveButton,
  showRemoveIcon,
  userId,
}: PaperCardProps) => {
  const [status, setStatus] = useState<PaperStatus>(paper.status);
  const [rating, setRating] = useState<number>(paper.rating ?? 0);

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-400';
      case 'in_progress':
        return 'bg-blue-400';
      case 'completed':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const toggleStatus = async () => {
    const newStatus: PaperStatus =
      status === 'pending'
        ? 'in_progress'
        : status === 'in_progress'
        ? 'completed'
        : 'pending';

    setStatus(newStatus);

    try {
      const response = await fetch('/api/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          doi: paper.doi,
          status: newStatus,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Error updating status:', result.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  const handleStatusClick = () => {
    if (!showRemoveIcon) {
      // Only allow status changes on saved papers
      return;
    }
    toggleStatus();
  };

  const handleRemoveClick = async () => {
    if (window.confirm('Are you sure you want to remove this paper from your To-Read list?')) {
      handleRemove(paper);
    }
  };

  const handleRatingChange = async (newRating: number) => {
    setRating(newRating);

    try {
      const response = await fetch('/api/update-rating', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          doi: paper.doi,
          rating: newRating,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        console.error('Error updating rating:', result.message);
      }
    } catch (error) {
      console.error('Network error:', error);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl hover:scale-[1.01] transition-transform duration-300 mb-6">
      <h2 className="font-bold text-lg mb-2 text-blue-700 hover:text-blue-900">{paper.title}</h2>

      <div className="flex flex-wrap items-center text-sm text-gray-600 mb-2 gap-3">
        <span className="flex items-center gap-1">
          <Calendar className="h-4 w-4" />
          {paper.published ? new Date(paper.published).toLocaleDateString() : 'Unknown date'}
        </span>

        {paper.first_author && (
          <span className="font-semibold">{paper.first_author}</span>
        )}

        {paper.author_affiliation && paper.author_affiliation !== 'No affiliation listed' && (
          <span className="text-gray-600">{`(${paper.author_affiliation})`}</span>
        )}

        {paper.created_at && (
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            Pending: {new Date(paper.created_at).toLocaleDateString()}
          </span>
        )}

        {paper.in_process_at && (
          <span className="flex items-center gap-1">
            <Loader className="h-4 w-4" />
            Processing: {new Date(paper.in_process_at).toLocaleDateString()}
          </span>
        )}

        {paper.done_at && (
          <span className="flex items-center gap-1">
            <CheckCircle className="h-4 w-4" />
            Completed: {new Date(paper.done_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {paper.summary && <p className="text-gray-700 mb-3 line-clamp-3">{paper.summary}</p>}

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
          {showRemoveIcon && (
            <button
              onClick={handleStatusClick}
              className={`flex items-center space-x-2 ${getStatusColor()} px-4 py-1 rounded-full text-white`}
              aria-label="Change Status"
            >
              {status === 'pending' && <PauseCircle className="h-5 w-5" />}
              {status === 'in_progress' && <Loader className="h-5 w-5" />}
              {status === 'completed' && <CheckCircle className="h-5 w-5" />}
              <span>{status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}</span>
            </button>
          )}

          {showRemoveIcon && (
            <div className="flex items-center space-x-2">
              <span className="text-gray-600">Love:</span>
              <StarRating rating={rating} onRatingChange={handleRatingChange} />
            </div>
          )}

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
