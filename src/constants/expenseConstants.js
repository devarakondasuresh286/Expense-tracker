export const STORAGE_KEY = 'expense_tracker_expenses';
export const GROUPS_STORAGE_KEY = 'expense_tracker_groups';

export const EXPENSE_TYPES = {
	PERSONAL: 'personal',
	GROUP: 'group',
};

export const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Other'];

export const FILTER_CATEGORIES = ['All', ...EXPENSE_CATEGORIES];
export const DEFAULT_FILTER_CATEGORY = FILTER_CATEGORIES[0];

export const CURRENT_USER = {
	id: 'user-you',
	name: 'You',
};

export const DEFAULT_FRIENDS = [
	{ id: 'user-alex', name: 'Alex' },
	{ id: 'user-jordan', name: 'Jordan' },
	{ id: 'user-riley', name: 'Riley' },
	{ id: 'user-casey', name: 'Casey' },
	{ id: 'user-morgan', name: 'Morgan' },
];

export const DEFAULT_GROUPS = [
	{
		id: 'group-trip-squad',
		name: 'Trip Squad',
		memberIds: [CURRENT_USER.id, 'user-alex', 'user-jordan'],
	},
	{
		id: 'group-roommates',
		name: 'Roommates',
		memberIds: [CURRENT_USER.id, 'user-riley', 'user-casey'],
	},
	{
		id: 'group-weekend-club',
		name: 'Weekend Club',
		memberIds: [CURRENT_USER.id, 'user-morgan'],
	},
];