


import React from 'react';
import type { Member } from '../types';
import { Role } from '../types';
import { roleColors } from '../constants';

interface MemberViewProps {
    members: Member[];
    onViewProfile: (userId: string) => void;
}

export const MemberView: React.FC<MemberViewProps> = ({ members, onViewProfile }) => {
    // Sort members by role priority: Host > Moderator > Contributor > Viewer
    const sortedMembers = [...members].sort((a, b) => {
        const roleOrder = { [Role.Host]: 0, [Role.Moderator]: 1, [Role.Contributor]: 2, [Role.Viewer]: 3 };
        return roleOrder[a.role] - roleOrder[b.role];
    });

    return (
        <div className="p-4 space-y-3">
            {sortedMembers.map(member => (
                <div 
                    key={member.id + member.nickname} 
                    onClick={() => onViewProfile(member.id)}
                    className="flex items-center justify-between p-3 bg-brand-surface rounded-lg border border-brand-border cursor-pointer hover:bg-brand-border/20"
                >
                    <div>
                        <p className="font-semibold">{member.nickname}</p>
                        <p className="text-xs text-brand-text-secondary">{member.tagId}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${roleColors[member.role]}`}>
                        {member.role}
                    </span>
                </div>
            ))}
        </div>
    );
};