// Centralized role models configuration
import User from '../model/user.js';
import Tutor from '../model/tutor.js';
import Admin from '../model/admin.js';

export const roleModels = Object.freeze({
    user: User,
    tutor: Tutor,
    admin: Admin
});

export const getRoleModel = (role) => {
    const normalizedRole = role?.toLowerCase();
    return roleModels[normalizedRole] || null;
};

export default roleModels;
