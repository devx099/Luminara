import React, { useState } from 'react';
import { Brain } from './icons';

interface LoginPageProps {
  onLogin: (email: string, password: string) => void;
  onRegister: (name: string, email: string, password: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onRegister }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (isRegistering) {
      if (!name.trim() || !password.trim() || !confirmPassword.trim()) {
        setError('All fields are required for registration.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      onRegister(name, email, password);
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Both email and password are required.');
        return;
      }
      onLogin(email, password);
    }
  };

  const inputBaseClasses = "appearance-none relative block w-full px-3 py-3 border placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm";
  const inputColorClasses = "bg-white dark:bg-white border-gray-300 dark:border-gray-300 text-gray-900 dark:text-gray-900";

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 shadow-2xl rounded-2xl">
        <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Brain className="w-7 h-7 text-white" />
                </div>
                 <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Luminara</h1>
            </div>
          <p className="text-gray-600 dark:text-gray-400">{isRegistering ? 'Create an account to get started.' : 'Sign in to manage your AI agents.'}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {isRegistering && (
              <div>
                <label htmlFor="name" className="sr-only">Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  className={`${inputBaseClasses} ${inputColorClasses} rounded-t-md`}
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email address</label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`${inputBaseClasses} ${inputColorClasses} ${isRegistering ? '' : 'rounded-t-md'}`}
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete={isRegistering ? "new-password" : "current-password"}
                required
                className={`${inputBaseClasses} ${inputColorClasses} ${isRegistering ? '' : 'rounded-b-md'}`}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
             {isRegistering && (
                <div>
                    <label htmlFor="confirm-password-sr" className="sr-only">Confirm Password</label>
                    <input
                        id="confirm-password-sr"
                        name="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        className={`${inputBaseClasses} ${inputColorClasses} rounded-b-md`}
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            )}
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </div>
        </form>
         <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            {isRegistering ? 'Already have an account? ' : 'New user? '}
            <button onClick={() => { setIsRegistering(!isRegistering); setError(''); }} className="font-medium text-blue-600 hover:text-blue-500">
              {isRegistering ? 'Sign In' : 'Create an account'}
            </button>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;