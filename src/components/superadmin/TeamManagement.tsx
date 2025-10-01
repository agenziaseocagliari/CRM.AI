import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { Modal } from '../ui/Modal';
import { UsersIcon } from '../ui/icons';

interface TeamMember {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user' | 'viewer';
    organizationId: string;
    organizationName: string;
    status: 'active' | 'pending' | 'suspended';
    invitedAt: string;
}

// Mock data for demonstration
const mockTeamMembers: TeamMember[] = [
    {
        id: '1',
        email: 'admin@company1.com',
        name: 'Mario Rossi',
        role: 'admin',
        organizationId: 'org1',
        organizationName: 'Azienda Alpha',
        status: 'active',
        invitedAt: '2024-01-15T10:00:00Z'
    },
    {
        id: '2',
        email: 'user@company1.com',
        name: 'Laura Bianchi',
        role: 'user',
        organizationId: 'org1',
        organizationName: 'Azienda Alpha',
        status: 'active',
        invitedAt: '2024-01-20T14:30:00Z'
    },
];

export const TeamManagement: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>(mockTeamMembers);
    const [isInviteModalOpen, setInviteModalOpen] = useState(false);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteName, setInviteName] = useState('');
    const [inviteRole, setInviteRole] = useState<TeamMember['role']>('user');
    const [inviteOrgId, setInviteOrgId] = useState('');
    const [filterOrg, setFilterOrg] = useState<string>('all');

    const handleInvite = () => {
        if (!inviteEmail || !inviteName || !inviteOrgId) {
            toast.error('Compila tutti i campi richiesti');
            return;
        }

        const newMember: TeamMember = {
            id: `${Date.now()}`,
            email: inviteEmail,
            name: inviteName,
            role: inviteRole,
            organizationId: inviteOrgId,
            organizationName: `Org ${inviteOrgId}`,
            status: 'pending',
            invitedAt: new Date().toISOString()
        };

        setMembers(prev => [newMember, ...prev]);
        setInviteModalOpen(false);
        setInviteEmail('');
        setInviteName('');
        setInviteRole('user');
        setInviteOrgId('');
        
        toast.success(`Invito inviato a ${inviteEmail}`);
    };

    const handleSuspend = (memberId: string) => {
        setMembers(prev =>
            prev.map(m => (m.id === memberId ? { ...m, status: 'suspended' } : m))
        );
        toast.success('Utente sospeso');
    };

    const handleReactivate = (memberId: string) => {
        setMembers(prev =>
            prev.map(m => (m.id === memberId ? { ...m, status: 'active' } : m))
        );
        toast.success('Utente riattivato');
    };

    const handleDelete = (memberId: string) => {
        if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;
        
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success('Utente eliminato');
    };

    const handleResendInvite = (member: TeamMember) => {
        toast.success(`Invito reinviato a ${member.email}`);
    };

    const handleEditMember = (member: TeamMember) => {
        setSelectedMember(member);
        setEditModalOpen(true);
    };

    const handleSaveEdit = () => {
        if (!selectedMember) return;
        
        setMembers(prev =>
            prev.map(m => (m.id === selectedMember.id ? selectedMember : m))
        );
        setEditModalOpen(false);
        setSelectedMember(null);
        toast.success('Modifiche salvate');
    };

    const filteredMembers = filterOrg === 'all'
        ? members
        : members.filter(m => m.organizationId === filterOrg);

    const organizations = Array.from(new Set(members.map(m => m.organizationId)));

    const statusColors = {
        active: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300',
        pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300',
        suspended: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300',
    };

    const roleColors = {
        admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
        user: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        viewer: 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300',
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <UsersIcon className="w-8 h-8 text-primary dark:text-dark-primary" />
                    <h1 className="text-3xl font-bold text-text-primary dark:text-dark-text-primary">
                        Gestione Team e Collaboratori
                    </h1>
                </div>
                <button
                    onClick={() => setInviteModalOpen(true)}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 font-medium"
                >
                    ➕ Invita Collaboratore
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Membri Totali</p>
                    <p className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                        {members.length}
                    </p>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Attivi</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {members.filter(m => m.status === 'active').length}
                    </p>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">In Attesa</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                        {members.filter(m => m.status === 'pending').length}
                    </p>
                </div>
                <div className="bg-card dark:bg-dark-card p-4 rounded-lg shadow">
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Sospesi</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {members.filter(m => m.status === 'suspended').length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Filtra per organizzazione:</label>
                <select
                    value={filterOrg}
                    onChange={(e) => setFilterOrg(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200"
                >
                    <option value="all">Tutte</option>
                    {organizations.map(orgId => (
                        <option key={orgId} value={orgId}>
                            {members.find(m => m.organizationId === orgId)?.organizationName || orgId}
                        </option>
                    ))}
                </select>
            </div>

            {/* Members Table */}
            <div className="bg-card dark:bg-dark-card shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Utente
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Organizzazione
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Ruolo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Stato
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Invitato il
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                Azioni
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredMembers.map(member => (
                            <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                                            {member.name}
                                        </p>
                                        <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
                                            {member.email}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                                    {member.organizationName}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${roleColors[member.role]}`}>
                                        {member.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 text-xs rounded-full ${statusColors[member.status]}`}>
                                        {member.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                                    {new Date(member.invitedAt).toLocaleDateString('it-IT')}
                                </td>
                                <td className="px-6 py-4 text-right text-sm space-x-2">
                                    <button
                                        onClick={() => handleEditMember(member)}
                                        className="text-primary hover:text-indigo-900 dark:text-indigo-400"
                                    >
                                        Modifica
                                    </button>
                                    {member.status === 'pending' && (
                                        <button
                                            onClick={() => handleResendInvite(member)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                                        >
                                            Reinvia
                                        </button>
                                    )}
                                    {member.status === 'active' && (
                                        <button
                                            onClick={() => handleSuspend(member.id)}
                                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400"
                                        >
                                            Sospendi
                                        </button>
                                    )}
                                    {member.status === 'suspended' && (
                                        <button
                                            onClick={() => handleReactivate(member.id)}
                                            className="text-green-600 hover:text-green-900 dark:text-green-400"
                                        >
                                            Riattiva
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(member.id)}
                                        className="text-red-600 hover:text-red-900 dark:text-red-400"
                                    >
                                        Elimina
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            <Modal
                isOpen={isInviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                title="Invita Nuovo Collaboratore"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <input
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="collaboratore@azienda.com"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                        <input
                            type="text"
                            value={inviteName}
                            onChange={(e) => setInviteName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Mario Rossi"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo *</label>
                        <select
                            value={inviteRole}
                            onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        >
                            <option value="viewer">Viewer (sola lettura)</option>
                            <option value="user">User (standard)</option>
                            <option value="admin">Admin (completo)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ID Organizzazione *</label>
                        <input
                            type="text"
                            value={inviteOrgId}
                            onChange={(e) => setInviteOrgId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="org-123"
                        />
                    </div>
                    <div className="flex justify-end space-x-2 pt-4">
                        <button
                            onClick={() => setInviteModalOpen(false)}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            Annulla
                        </button>
                        <button
                            onClick={handleInvite}
                            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                        >
                            Invia Invito
                        </button>
                    </div>
                </div>
            </Modal>

            {/* Edit Member Modal */}
            {selectedMember && (
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    title="Modifica Collaboratore"
                >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={selectedMember.email}
                                disabled
                                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                            <input
                                type="text"
                                value={selectedMember.name}
                                onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ruolo</label>
                            <select
                                value={selectedMember.role}
                                onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value as TeamMember['role'] })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex justify-end space-x-2 pt-4">
                            <button
                                onClick={() => setEditModalOpen(false)}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-indigo-700"
                            >
                                Salva Modifiche
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
