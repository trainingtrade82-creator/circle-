
import React from 'react';
import type { Member } from '../types';

interface WalletViewProps {
    members: Member[];
    totalWallet: number;
}

export const WalletView: React.FC<WalletViewProps> = ({ members, totalWallet }) => {
    const totalPoints = members.reduce((sum, member) => sum + member.loyaltyPoints, 0);

    return (
        <div className="p-4">
            <div className="bg-brand-surface border border-brand-border rounded-lg p-6 text-center mb-6">
                <p className="text-sm text-brand-text-secondary mb-1">Circle Wallet Balance</p>
                <p className="text-4xl font-bold tracking-tight text-brand-accent">${totalWallet.toLocaleString()}</p>
                <p className="text-xs text-brand-text-secondary mt-2">Simulated rewards based on circle activity.</p>
            </div>

            <h3 className="font-bold mb-4 text-lg">Member Loyalty</h3>

            <div className="space-y-3">
                {members.sort((a,b) => b.loyaltyPoints - a.loyaltyPoints).map(member => {
                    const sharePercentage = totalPoints > 0 ? (member.loyaltyPoints / totalPoints) * 100 : 0;
                    return (
                        <div key={member.id + member.nickname} className="bg-brand-surface rounded-lg p-3 border border-brand-border">
                            <div className="flex justify-between items-center mb-2">
                                <p className="font-semibold">{member.nickname}</p>
                                <p className="text-brand-primary font-bold">{member.loyaltyPoints.toLocaleString()} LP</p>
                            </div>
                            <div className="w-full bg-brand-bg rounded-full h-2.5">
                                <div 
                                    className="bg-brand-primary h-2.5 rounded-full" 
                                    style={{ width: `${sharePercentage}%` }}
                                ></div>
                            </div>
                             <p className="text-right text-xs mt-1 text-brand-text-secondary">{sharePercentage.toFixed(2)}% Share</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
