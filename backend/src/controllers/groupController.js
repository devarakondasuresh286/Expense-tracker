import { validateAddMemberInput, validateCreateGroupInput } from '../validations/groupValidation.js';
import * as groupService from '../services/groupService.js';

export const listGroups = async (req, res) => {
  const groups = await groupService.listGroups(req.user._id);
  return res.json({ groups });
};

export const createGroup = async (req, res) => {
  validateCreateGroupInput(req.body || {});

  const group = await groupService.createGroup({
    currentUserId: req.user._id,
    name: req.body.name,
    memberIds: req.body.memberIds || [],
  });

  return res.status(201).json({ group });
};

export const addMemberToGroup = async (req, res) => {
  validateAddMemberInput(req.body || {});

  const group = await groupService.addMemberToGroup({
    currentUserId: req.user._id,
    groupId: req.params.groupId,
    memberId: req.body.memberId,
  });

  return res.json({ group });
};
