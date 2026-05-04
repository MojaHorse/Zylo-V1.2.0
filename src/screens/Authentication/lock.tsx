import React from 'react';
// 👇 Update this path to where your LoginScreen file actually lives
import LoginScreen from '../screens/Authentication/LoginScreen'; 

export default function LockRoute() {
  // We render your existing screen here. 
  // If your LoginScreen accepts props (like mode="pin"), pass them here.
  return <LoginScreen />;
}