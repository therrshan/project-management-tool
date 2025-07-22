import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, UserPlus, Trash2, Crown, Shield, Eye, Search } from 'lucide-react';
import { LoadingButton } from '../common/LoadingSpinner';
import apiService from '../../utils/api';
import type { WorkspaceMember } from '../../types';

const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER'], {
    message: 'Please select a role'
  })
});

interface SearchUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  currentUserId: string;
  workspaceCreatorId: string;
  members: WorkspaceMember[];
  onMembersUpdated: () => void;
}

type InviteFormData = z.infer<typeof inviteSchema>;

const roleIcons = {
  ADMIN: Crown,
  MEMBER: Shield,
  VIEWER: Eye
};

const roleColors = {
  ADMIN: 'text-yellow-600 bg-yellow-50',
  MEMBER: 'text-blue-600 bg-blue-50',
  VIEWER: 'text-gray-600 bg-gray-50'
};

export const ManageMembersModal = ({ 
  isOpen, 
  onClose, 
  workspaceId, 
  currentUserId,
  workspaceCreatorId,
  members, 
  onMembersUpdated 
}: ManageMembersModalProps) => {
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState<string | null>(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: 'MEMBER'
    }
  });

  const watchedEmail = watch('email');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        handleSearchUsers();
      }, 300);
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const handleSearchUsers = async () => {
    try {
      setIsSearching(true);
      const response = await apiService.searchUsers(searchQuery);
      const filteredResults = response.users.filter(user => 
        !members.some(member => member.user.email === user.email)
      );
      setSearchResults(filteredResults);
      setShowDropdown(filteredResults.length > 0);
    } catch (error) {
      console.error('Failed to search users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user: SearchUser) => {
    setSelectedUser(user);
    setValue('email', user.email);
    setSearchQuery(user.email);
    setShowDropdown(false);
  };

  const handleInvite = async (data: InviteFormData) => {
    try {
      setError(null);
      setIsInviting(true);
      await apiService.inviteUser(workspaceId, data);
      reset();
      setSelectedUser(null);
      setSearchQuery('');
      setSearchResults([]);
      onMembersUpdated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to invite user');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      setError(null);
      setIsRemoving(userId);
      await apiService.removeUser(workspaceId, userId);
      onMembersUpdated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsRemoving(null);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setError(null);
      setIsUpdatingRole(userId);
      await apiService.updateUserRole(workspaceId, { userId, role: newRole });
      onMembersUpdated();
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to update role');
    } finally {
      setIsUpdatingRole(null);
    }
  };

  const handleClose = () => {
    reset();
    setError(null);
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setShowDropdown(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={handleClose}
        />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Manage Members</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-3">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}

            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invite New Member</h3>
              <form onSubmit={handleSubmit(handleInvite)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative" ref={dropdownRef}>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setValue('email', e.target.value);
                            if (selectedUser && selectedUser.email !== e.target.value) {
                              setSelectedUser(null);
                            }
                          }}
                          onFocus={() => {
                            if (searchResults.length > 0) setShowDropdown(true);
                          }}
                          className={`w-full px-3 py-2 pr-10 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="Search by name or email..."
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          {isSearching ? (
                            <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                          ) : (
                            <Search className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      
                      {showDropdown && searchResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                          {searchResults.map((user) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 focus:outline-none focus:bg-gray-50"
                            >
                              <img
                                src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=3b82f6&color=ffffff`}
                                alt={user.name}
                                className="h-8 w-8 rounded-full flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {user.name}
                                </p>
                                <p className="text-sm text-gray-500 truncate">
                                  {user.email}
                                </p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                          <p className="text-sm text-gray-500">No users found</p>
                        </div>
                      )}
                    </div>
                    
                    <input
                      {...register('email')}
                      type="hidden"
                      value={watchedEmail}
                    />
                    
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role
                    </label>
                    <select
                      {...register('role')}
                      className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errors.role ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="VIEWER">Viewer</option>
                      <option value="MEMBER">Member</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                    )}
                  </div>
                </div>

                <LoadingButton
                type="submit"
                isLoading={isInviting}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                <UserPlus className="h-4 w-4 mr-2" />
                </LoadingButton>
              </form>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Current Members ({members.length})
              </h3>
              <div className="space-y-3">
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                  const isCreator = member.userId === workspaceCreatorId;
                  const isCurrentUser = member.userId === currentUserId;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={member.user.avatar || `https://ui-avatars.com/api/?name=${member.user.name}&background=3b82f6&color=ffffff`}
                          alt={member.user.name}
                          className="h-10 w-10 rounded-full"
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900">
                              {member.user.name}
                              {isCurrentUser && (
                                <span className="text-xs text-gray-500 ml-1">(You)</span>
                              )}
                              {isCreator && (
                                <span className="text-xs text-yellow-600 ml-1">(Creator)</span>
                              )}
                            </p>
                          </div>
                          <p className="text-sm text-gray-600">{member.user.email}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {!isCreator ? (
                            <select
                              value={member.role}
                              onChange={(e) => handleUpdateRole(member.userId, e.target.value)}
                              disabled={isUpdatingRole === member.userId}
                              className="text-xs px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              <option value="VIEWER">Viewer</option>
                              <option value="MEMBER">Member</option>
                              <option value="ADMIN">Admin</option>
                            </select>
                          ) : (
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium ${roleColors[member.role as keyof typeof roleColors]}`}>
                              <RoleIcon className="h-3 w-3" />
                              <span>{member.role}</span>
                            </div>
                          )}
                        </div>

                        {!isCreator && !isCurrentUser && (
                          <button
                            onClick={() => handleRemoveMember(member.userId)}
                            disabled={isRemoving === member.userId}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                            title="Remove member"
                          >
                            {isRemoving === member.userId ? (
                              <div className="animate-spin h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-end p-6 border-t">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};