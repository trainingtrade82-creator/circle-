



import React from 'react';
import type { Circle, User } from '../types';
import { CircleType, Role } from '../types';

interface CircleCardProps {
  circle: Circle;
  onSelect: () => void;
  currentUser: User;
  onJoin: (circleId: string) => void;
  onLeave: (circleId: string) => void;
  onRequestToJoin: (circleId: string) => void;
}

export const CircleCard: React.FC<CircleCardProps> = ({ circle, onSelect, currentUser, onJoin, onLeave, onRequestToJoin }) => {
  const isMember = currentUser.memberships.includes(circle.id);
  const memberInfo = isMember ? circle.members.find(m => m.id === currentUser.id) : undefined;
  const isHost = memberInfo?.role === Role.Host;
  const hasRequested = !isMember && circle.type === CircleType.Private && circle.joinRequests?.includes(currentUser.id);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isMember && !isHost) {
      if (window.confirm(`Are you sure you want to leave "${circle.name}"?`)) {
        onLeave(circle.id);
      }
    } else if (!isMember && circle.type === CircleType.Public) {
      onJoin(circle.id);
    } else if (!isMember && circle.type === CircleType.Private && !hasRequested) {
      onRequestToJoin(circle.id);
    }
  };

  const renderButton = () => {
    const baseButtonClasses = "px-4 py-1.5 rounded-full font-semibold text-sm transition-colors flex-shrink-0";
    
    if (isMember) {
      if (isHost) {
        return (
          <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-red-500/20 text-red-400 border-red-500/50">
            Host
          </span>
        );
      }
      return (
        <button onClick={handleButtonClick} className={`${baseButtonClasses} bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-brand-danger/20 hover:text-brand-danger hover:border-brand-danger/50`}>
          Leave
        </button>
      );
    }

    if (circle.type === CircleType.Public) {
      return (
        <button onClick={handleButtonClick} className={`${baseButtonClasses} bg-brand-primary text-white hover:bg-brand-secondary`}>
          Join
        </button>
      );
    }

    // Private circle
    if (hasRequested) {
      return (
        <button disabled className={`${baseButtonClasses} bg-brand-surface border border-brand-border text-brand-text-secondary cursor-not-allowed`}>
          Requested
        </button>
      );
    }

    return (
      <button onClick={handleButtonClick} className={`${baseButtonClasses} bg-brand-primary text-white hover:bg-brand-secondary`}>
        Request
      </button>
    );
  };
  
  return (
    <div 
        onClick={onSelect} 
        className="bg-brand-surface border border-brand-border rounded-lg p-3 flex items-center space-x-4 cursor-pointer hover:bg-brand-border/20 transition-colors duration-200"
    >
      <img src={circle.logo} alt={`${circle.name} logo`} className="w-12 h-12 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="font-bold truncate">{circle.name}</p>
        <p className="text-sm text-brand-text-secondary truncate">{circle.members.length} members</p>
      </div>
      <div className="flex-shrink-0">
        {renderButton()}
      </div>
    </div>
  );
};