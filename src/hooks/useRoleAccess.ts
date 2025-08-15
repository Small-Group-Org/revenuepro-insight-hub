import { useUserContext } from '@/utils/UserContext';

export const useRoleAccess = () => {
  const { user } = useUserContext();
  
  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';
  
  const canAddActualData = isAdmin;
  const canModifyLeadSheet = isAdmin;
  
  return {
    isAdmin,
    isUser,
    canAddActualData,
    canModifyLeadSheet,
    userRole: user?.role
  };
};
