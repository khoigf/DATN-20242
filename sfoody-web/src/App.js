import React from 'react';
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ManageRecipes from './pages/ManageRecipes';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import UserList from './pages/UserList';
import PostList from './pages/PostList';
import ReportList from './pages/ReportList';
import MealPlannerPage from './pages/MealPlannerPage';
import ChatBot from './components/Chatbot';
import EditMealPlanPage from './pages/EditMealPlanPage';
import ManageMealPlansPage from './pages/ManageMealPlansPage';

function App() {
  const [showChat, setShowChat] = useState(false);
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/recipes/manage" element={<ManageRecipes />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/edit-profile" element={<EditProfilePage />} />
        <Route path="/meal-planner" element={<MealPlannerPage />} />
        <Route path="/meal-plans/manage" element={<ManageMealPlansPage />} />
        <Route path="/meal-plans/edit/:id" element={<EditMealPlanPage />} />
        {/* Admin routes */}
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserList />} />
        <Route path="/admin/posts" element={<PostList />} />
        <Route path="/admin/reports" element={<ReportList />} />
      </Routes>
      {showChat && <ChatBot />}
      <button className="chatbot-toggle" onClick={() => setShowChat(!showChat)}>💬</button>
    </Router>
  );
}

export default App;