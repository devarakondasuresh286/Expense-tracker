import Group from '../models/Group.js';
import User from '../models/User.js';
import { createHttpError } from '../utils/httpError.js';

const normalizeGroup = (groupDoc) => ({
  id: groupDoc._id,
  name: groupDoc.name,
  createdBy: groupDoc.createdBy,
  memberIds: (groupDoc.members || []).map((member) => String(member._id || member)),
  members: (groupDoc.members || []).map((member) => ({
    id: String(member._id || member),
    name: member.name,
    email: member.email,
  })),
});

export const listGroups = async (currentUserId) => {
  const groups = await Group.find({ members: currentUserId })
    .populate('members', '_id name email')
    .sort({ createdAt: -1 });

  return groups.map(normalizeGroup);
};

export const createGroup = async ({ currentUserId, name, memberIds }) => {
  const uniqueMemberIds = Array.from(new Set([...memberIds, String(currentUserId)]));
  const existingMembers = await User.find({ _id: { $in: uniqueMemberIds } }).select('_id');

  if (existingMembers.length !== uniqueMemberIds.length) {
    throw createHttpError(400, 'One or more members are invalid.');
  }

  const group = await Group.create({
    name: name.trim(),
    createdBy: currentUserId,
    members: uniqueMemberIds,
  });

  const populated = await Group.findById(group._id).populate('members', '_id name email');
  return normalizeGroup(populated);
};

export const addMemberToGroup = async ({ currentUserId, groupId, memberId }) => {
  const group = await Group.findOne({ _id: groupId, members: currentUserId });
  if (!group) {
    throw createHttpError(404, 'Group not found.');
  }

  const user = await User.findById(memberId).select('_id');
  if (!user) {
    throw createHttpError(404, 'User not found.');
  }

  group.members = Array.from(new Set([...group.members.map(String), String(memberId)]));
  await group.save();

  const populated = await Group.findById(group._id).populate('members', '_id name email');
  return normalizeGroup(populated);
};
