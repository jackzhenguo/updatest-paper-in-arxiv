'use client';

import { useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { showError, showSuccess, showWarn } from '@/components/shared/ShowMsg';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal = ({ isOpen, onClose }: AuthModalProps) => {
  const [isRegister, setIsRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { setIsLoggedIn, setUserId, refreshAuth } = useAuth();

  useEffect(() => {
    if (!isOpen) {
      setIsRegister(false);
      setLoginEmail('');
      setLoginPassword('');
      setRegisterEmail('');
      setRegisterPassword('');
      setConfirmPassword('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const handleLogin = async () => {
    if (loginEmail && loginPassword) {
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: loginEmail, password: loginPassword }),
        });
        const data = await response.json();
        if (response.ok) {
          showSuccess(data.message);
          setIsLoggedIn(true);
          setUserId(data.userId);
          await refreshAuth();
          onClose();
        } else {
          showWarn(data.message ?? 'Invalid credentials.');
        }
      } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred. Please try again.');
      }
    } else {
      showWarn('Please fill in both email and password.');
    }
  };

  const handleRegister = async () => {
    if (!registerEmail || !registerPassword) {
      showWarn('Please fill in both email and password.');
      return;
    }

    if (registerPassword !== confirmPassword) {
      showWarn('Passwords do not match.');
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: registerEmail, password: registerPassword }),
      });
      const data = await response.json();
      if (response.ok) {
        showSuccess(data.message);
        setIsRegister(false);
      } else {
        showWarn(data.message ?? 'Unable to register.');
      }
    } catch (error) {
      console.error('Registration error:', error);
      showError('An error occurred. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          {isRegister ? 'Register' : 'Login'}
        </h2>

        {isRegister ? (
          <>
            <div className="mb-4">
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm Password"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleRegister}
              className="w-full p-3 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
            >
              Register
            </button>
            <div className="text-center mt-4">
              <button
                onClick={() => setIsRegister(false)}
                className="text-blue-600 hover:text-blue-800"
              >
                Already have an account? Login here.
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4">
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <div className="mb-4">
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full p-3 border border-gray-300 rounded-md"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full p-3 bg-blue-500 text-white font-bold rounded-md hover:bg-blue-600"
            >
              Login
            </button>
            <div className="text-center mt-4">
              <button
                onClick={() => setIsRegister(true)}
                className="text-blue-600 hover:text-blue-800"
              >
                Don't have an account? Register here.
              </button>
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full mt-6 p-3 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
