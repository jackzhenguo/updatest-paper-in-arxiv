'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  onRatingChange: (newRating: number) => void;
}

const StarRating = ({ rating, onRatingChange }: StarRatingProps) => {
  const handleClick = (index: number) => {
    onRatingChange(index);
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer h-5 w-5 ${star <= rating ? 'text-yellow-400' : 'text-gray-400'}`}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
