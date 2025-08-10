export const getInitials = (nameOrEmail: string): string => {
    if (!nameOrEmail) return '';
    
    const cleanName = nameOrEmail.includes('@') 
      ? nameOrEmail.split('@')[0] 
      : nameOrEmail;
    
    const parts = cleanName.split(/[\s._-]+/).filter(part => part.length > 0);
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };