import React from 'react';
import type { Circle } from '../types';
import { Role } from '../types';
import { roleColors } from '../constants';

interface ManageMembersModalProps {
    circle: Circle;
    currentUserRole: Role;
    onClose: () => void;
    onUpdateRole: (circleId: string, memberId: string, newRole: Role) => void;
    onRemoveMember: (circleId: string, memberId: string) => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({ circle, currentUserRole, onClose, onUpdateRole, onRemoveMember }) => {
    
    // Sort members by role priority
    const sortedMembers = [...circle.members].sort((a, b) => {
        const roleOrder = { [Role.Host]: 0, [Role.Moderator]: 1, [Role.Contributor]: 2, [Role.Viewer]: 3 };
        return roleOrder[a.role] - roleOrder[b.role];
    });

    const availableRolesForHost = [Role.Moderator, Role.Contributor, Role.Viewer];
    const availableRolesForMod = [Role.Contributor, Role.Viewer];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-brand-surface rounded-lg shadow-xl w-full max-w-md p-6 relative flex flex-col max-h-[80vh]">
                <header className="flex-shrink-0">
                    <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-brand-text-primary text-2xl">&times;</button>
                    <h2 className="text-xl font-bold mb-4 text-brand-text-primary">Manage Members</h2>
                </header>
                
                <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3">
                    {sortedMembers.map(member => {
                        let canManage = false;
                        if (currentUserRole === Role.Host && member.role !== Role.Host) {
                            canManage = true;
                        } else if (currentUserRole === Role.Moderator && (member.role === Role.Viewer || member.role === Role.Contributor)) {
                            canManage = true;
                        }

                        const rolesForSelect = currentUserRole === Role.Host ? availableRolesForHost : availableRolesForMod;
                        
                        return (
                            <div key={member.id} className="flex items-center justify-between p-3 bg-brand-bg rounded-lg border border-brand-border/50">
                                <div>
                                    <p className="font-semibold">{member.nickname}</p>
                                    <p className="text-xs text-brand-text-secondary">{member.tagId}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {canManage ? (
                                        <>
                                            <select
                                                value={member.role}
                                                onChange={(e) => onUpdateRole(circle.id, member.id, e.target.value as Role)}
                                                className="bg-brand-surface border border-brand-border rounded-md px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand-primary text-brand-text-primary appearance-none"
                                            >
                                                {rolesForSelect.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </select>
                                            <button 
                                                onClick={() => {
                                                    if (window.confirm(`Are you sure you want to remove ${member.nickname} from the circle?`)) {
                                                        onRemoveMember(circle.id, member.id);
                                                    }
                                                }}
                                                className="text-brand-danger hover:bg-brand-danger/20 p-1.5 rounded-full transition-colors"
                                                aria-label={`Remove ${member.nickname}`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </>
                                    ) : (
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${roleColors[member.role]}`}>
                                            {member.role}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                 <div className="mt-6 flex-shrink-0">
                    <button type="button" onClick={onClose} className="w-full bg-brand-primary text-white font-bold py-2 px-4 rounded-md hover:bg-brand-secondary transition-colors">
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
};