import React from 'react';
import type { Circle, User } from '../types';
import { ChatAccess } from '../types';

interface SettingsViewProps {
    circle: Circle;
    allUsers: User[];
    onApprove: (circleId: string, userId: string) => void;
    onDeny: (circleId: string, userId: string) => void;
    onOpenEditCircle: (circleId: string) => void;
    onOpenManageMembers: (circleId: string) => void;
    onDeleteCircle: (circleId: string) => void;
    onApprovePromotion: (circleId: string, userId: string) => void;
    onDenyPromotion: (circleId: string, userId: string) => void;
    onApproveChatAccess: (circleId: string, userId: string, accessLevel: ChatAccess) => void;
    onDenyChatAccess: (circleId: string, userId: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
    const { circle, allUsers, onApprove, onDeny, onOpenEditCircle, onOpenManageMembers, onDeleteCircle, onApprovePromotion, onDenyPromotion, onApproveChatAccess, onDenyChatAccess } = props;

    const promotionRequesters = (circle.promotionRequests || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    const chatAccessRequesters = (circle.chatAccessRequests || []).map(id => allUsers.find(u => u.id === id)).filter(Boolean) as User[];
    
    return (
        <div className="p-4 space-y-6">
            {circle.type === 'Private' && (
                <div>
                    <h3 className="font-bold text-lg mb-2">Join Requests</h3>
                    <div className="bg-brand-surface rounded-lg border border-brand-border p-3">
                        {circle.joinRequests && circle.joinRequests.length > 0 ? (
                            <div className="space-y-3">
                                {circle.joinRequests.map(userId => {
                                    const user = allUsers.find(u => u.id === userId);
                                    return (
                                        <div key={userId} className="flex items-center justify-between">
                                            <p className="text-sm font-semibold">{user ? user.name : `User ID: ${userId}`}</p>
                                            <div className="flex gap-2">
                                                <button onClick={() => onApprove(circle.id, userId)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Approve</button>
                                                <button onClick={() => onDeny(circle.id, userId)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Deny</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        ) : (
                            <p className="text-sm text-brand-text-secondary text-center py-2">No pending join requests.</p>
                        )}
                    </div>
                </div>
            )}
            
            {(promotionRequesters.length > 0 || chatAccessRequesters.length > 0) && (
                 <div>
                    <h3 className="font-bold text-lg mb-2">Member Requests</h3>
                     <div className="bg-brand-surface rounded-lg border border-brand-border p-3 space-y-4">
                        {promotionRequesters.map(user => (
                             <div key={user.id}>
                                <p className="text-sm mb-1"><span className="font-semibold">{user.name}</span> wants to be a Contributor.</p>
                                <div className="flex gap-2">
                                    <button onClick={() => onApprovePromotion(circle.id, user.id)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Approve</button>
                                    <button onClick={() => onDenyPromotion(circle.id, user.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Deny</button>
                                </div>
                             </div>
                        ))}
                         {chatAccessRequesters.map(user => (
                             <div key={user.id}>
                                <p className="text-sm mb-1"><span className="font-semibold">{user.name}</span> requests chat access.</p>
                                <div className="flex gap-2 flex-wrap">
                                    <button onClick={() => onApproveChatAccess(circle.id, user.id, ChatAccess.Full)} className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-md hover:bg-green-500/40">Approve (Full)</button>
                                     <button onClick={() => onApproveChatAccess(circle.id, user.id, ChatAccess.ReadOnly)} className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-md hover:bg-blue-500/40">Approve (Read-Only)</button>
                                    <button onClick={() => onDenyChatAccess(circle.id, user.id)} className="text-xs bg-red-500/20 text-red-400 px-3 py-1 rounded-md hover:bg-red-500/40">Deny</button>
                                </div>
                             </div>
                        ))}
                    </div>
                </div>
            )}


            <div>
                 <h3 className="font-bold text-lg mb-2">Manage Circle</h3>
                 <div className="space-y-3">
                    <button onClick={() => onOpenEditCircle(circle.id)} className="w-full text-left bg-brand-surface hover:bg-gray-800/50 border border-brand-border rounded-lg p-3 transition-colors">
                        Edit Circle Info
                    </button>
                    <button onClick={() => onOpenManageMembers(circle.id)} className="w-full text-left bg-brand-surface hover:bg-gray-800/50 border border-brand-border rounded-lg p-3 transition-colors">
                        Manage Member Roles
                    </button>
                 </div>
            </div>

            <div>
                 <h3 className="font-bold text-lg mb-2 text-brand-danger">Danger Zone</h3>
                 <button onClick={() => onDeleteCircle(circle.id)} className="w-full text-left bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-lg p-3 transition-colors text-red-400">
                    Delete Circle
                </button>
            </div>

        </div>
    );
};