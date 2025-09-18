import React, { useState } from "react";
import { Star } from "lucide-react"; // Assuming you're using lucide-react for icons

interface StarRatingProps {
  rating: number;
  onRatingChange: (newRating: number) => void;
}

const StarRating: React.FC<StarRatingProps> = ({ rating, onRatingChange }) => {
  const handleClick = (index: number) => {
    onRatingChange(index);
  };

  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer h-5 w-5 ${star <= rating ? "text-yellow-400" : "text-gray-400"}`}
          onClick={() => handleClick(star)}
        />
      ))}
    </div>
  );
};

export default StarRating;
