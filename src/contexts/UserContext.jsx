import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('geoquiz-user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('geoquiz-user', JSON.stringify(user));
      setIsModalOpen(false);
    } else {
      localStorage.removeItem('geoquiz-user');
      setIsModalOpen(true); 
    }
  }, [user]);

  const saveUser = (name, email) => {
    setUser({ name, email });
  };

  const clearUser = () => {
    setUser(null);
  };

  const requestUserInfo = () => {
    if (!user) {
      setIsModalOpen(true);
    }
  };

  return (
    <UserContext.Provider value={{ user, saveUser, clearUser, isModalOpen, setIsModalOpen, requestUserInfo }}>
      {children}
    </UserContext.Provider>
  );
};