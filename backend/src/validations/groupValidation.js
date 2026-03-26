import { createHttpError } from '../utils/httpError.js';

export const validateCreateGroupInput = ({ name, memberIds }) => {
  if (!name?.trim()) {
    throw createHttpError(400, 'Group name is required.');
  }

  if (!Array.isArray(memberIds)) {
    throw createHttpError(400, 'memberIds should be an array.');
  }
};

export const validateAddMemberInput = ({ memberId }) => {
  if (!memberId) {
    throw createHttpError(400, 'memberId is required.');
  }
};
