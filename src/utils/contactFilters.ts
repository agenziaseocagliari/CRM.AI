import { Contact } from '../types';
import { FilterState } from '../components/contacts/ContactSearch';

export function filterContacts(
    contacts: Contact[], 
    searchTerm: string, 
    filters: FilterState
): Contact[] {
    let filtered = [...contacts];

    // Apply search filter
    if (searchTerm.trim()) {
        const search = searchTerm.toLowerCase().trim();
        filtered = filtered.filter(contact => 
            contact.name?.toLowerCase().includes(search) ||
            contact.email?.toLowerCase().includes(search) ||
            contact.company?.toLowerCase().includes(search)
        );
    }

    // Apply field filters
    if (filters.hasEmail) {
        filtered = filtered.filter(contact => contact.email && contact.email.trim() !== '');
    }

    if (filters.hasPhone) {
        filtered = filtered.filter(contact => contact.phone && contact.phone.trim() !== '');
    }

    if (filters.hasCompany) {
        filtered = filtered.filter(contact => contact.company && contact.company.trim() !== '');
    }

    if (filters.recent) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filtered = filtered.filter(contact => {
            if (!contact.created_at) return false;
            const createdDate = new Date(contact.created_at);
            return createdDate >= sevenDaysAgo;
        });
    }

    return filtered;
}