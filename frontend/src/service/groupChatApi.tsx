import { api } from "./api";

export interface CreateGroupPayload {
  groupName: string;
  members: string[];
  groupAvatar?: string;
  description?: string;
}

export interface GroupSettingsPayload {
  onlyAdminsCanEditInfo?: boolean;
  onlyAdminsCanAddMembers?: boolean;
  onlyAdminsCanRemoveMembers?: boolean;
  onlyAdminsCanSendMessages?: boolean;
}

export interface UpdateGroupInfoPayload {
  groupName?: string;
  groupAvatar?: string;
  description?: string;
}

// 1. Create Group
export const createGroup = async (data: CreateGroupPayload) => {
  const response = await api.post("/conversation/group/create-group", data);
  return response.data;
};

// 2. Add Member
export const addMember = async ({ conversationId, memberId }: { conversationId: string; memberId: string }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/add-member`, { memberId });
  return response.data;
};

// 3. Remove Member
export const removeMember = async ({ conversationId, memberId }: { conversationId: string; memberId: string }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/remove-member`, { memberId });
  return response.data;
};

// 4. Make Admin
export const makeAdmin = async ({ conversationId, memberId }: { conversationId: string; memberId: string }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/make-admin`, { memberId });
  return response.data;
};

// 5. Remove Admin
export const removeAdmin = async ({ conversationId, memberId }: { conversationId: string; memberId: string }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/remove-admin`, { memberId });
  return response.data;
};

// 6. Leave Group
export const leaveGroup = async (conversationId: string) => {
  const response = await api.patch(`/conversation/group/${conversationId}/leave`);
  return response.data;
};

// 7. Transfer Ownership
export const transferOwnership = async ({ conversationId, memberId }: { conversationId: string; memberId: string }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/transfer-ownership`, { memberId });
  return response.data;
};

// 8. Update Group Settings
export const updateGroupSettings = async ({ conversationId, settings }: { conversationId: string; settings: GroupSettingsPayload }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/settings`, settings);
  return response.data;
};

// 9. Get Group Info
export const getGroupInfo = async (conversationId: string) => {
  const response = await api.get(`/conversation/group/${conversationId}`);
  return response.data;
};

// 10. Delete Group
export const deleteGroup = async (conversationId: string) => {
  const response = await api.delete(`/conversation/group/${conversationId}`);
  return response.data;
};

// 11. Update Group Info
export const updateGroupInfo = async ({ conversationId, data }: { conversationId: string; data: UpdateGroupInfoPayload }) => {
  const response = await api.patch(`/conversation/group/${conversationId}/info`, data);
  return response.data;
};

// 12. Clear Group Chat
export const clearGroupChat = async (conversationId: string) => {
  const response = await api.delete(`/conversation/group/${conversationId}/clear-chat`);
  return response.data;
};

// 13. Generate Invite Link
export const generateInviteLink = async (conversationId: string) => {
  const response = await api.patch(`/conversation/group/${conversationId}/generate-invite`);
  return response.data;
};

// 14. Join Group by Link
export const joinByInviteLink = async (data: { inviteCode: string }) => {
  const response = await api.post("/conversation/group/join-by-link", data);
  return response.data;
};

