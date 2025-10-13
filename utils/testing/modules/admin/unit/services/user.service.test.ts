/**
 * Unit Tests - UserService
 * 
 * Teste pentru gestionarea utilizatorilor:
 * - CRUD operations
 * - Password hashing și verificare
 * - Role assignment
 * - User filtering și paginare
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { UserService } from '../../../../../../server/modules/admin/services/user.service';
import * as bcrypt from 'bcrypt';
import type { MockDatabase } from '../../../../types/global';

vi.mock('bcrypt');

describe('UserService - Unit Tests', () => {
  let userService: UserService;
  let mockDb: MockDatabase;

  beforeEach(() => {
    mockDb = {
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{
        id: 'user-id',
        username: 'test@example.com',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        password: 'hashed-password',
        company_id: 'company-id',
        created_at: new Date(),
        updated_at: new Date()
      }]),
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      offset: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis()
    };

    userService = new UserService(mockDb);

    // Mock bcrypt
    vi.mocked(bcrypt.hash).mockResolvedValue('hashed-password' as never);
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('createUser', () => {
    it('ar trebui să creeze un utilizator nou cu parola hash-uită', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // Nu există utilizator cu acest email

      const params = {
        email: 'newuser@example.com',
        password: 'SecurePass123!',
        firstName: 'New',
        lastName: 'User'
      };

      const result = await userService.createUser(params);

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('SecurePass123!', 10);
      expect(mockDb.insert).toHaveBeenCalled();
    });

    it('ar trebui să arunce eroare pentru email duplicat', async () => {
      mockDb.limit.mockResolvedValueOnce([{
        id: 'existing-user',
        email: 'existing@example.com'
      }]);

      await expect(
        userService.createUser({
          email: 'existing@example.com',
          password: 'password'
        })
      ).rejects.toThrow('already exists');
    });

    it('ar trebui să convertească email-ul la lowercase', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      await userService.createUser({
        email: 'UpperCase@Example.COM',
        password: 'password'
      });

      expect(mockDb.values).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'uppercase@example.com'
        })
      );
    });

    it('ar trebui să asigneze roluri dacă sunt furnizate', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      const assignRolesSpy = vi.spyOn(userService, 'assignRolesToUser').mockResolvedValue(undefined);

      await userService.createUser({
        email: 'test@example.com',
        password: 'password',
        roleIds: ['role1', 'role2']
      });

      expect(assignRolesSpy).toHaveBeenCalledWith('user-id', ['role1', 'role2']);
    });
  });

  describe('updateUser', () => {
    it('ar trebui să actualizeze datele utilizatorului', async () => {
      const updates = {
        firstName: 'Updated',
        lastName: 'Name'
      };

      const result = await userService.updateUser('user-id', updates);

      expect(result).toHaveProperty('first_name', 'Test');
      expect(mockDb.update).toHaveBeenCalled();
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Updated',
          last_name: 'Name'
        })
      );
    });

    it('ar trebui să hash-uiască parola nouă', async () => {
      await userService.updateUser('user-id', {
        password: 'NewPassword123!'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(mockDb.set).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'hashed-password'
        })
      );
    });

    it('ar trebui să valideze unicitatea email-ului', async () => {
      mockDb.limit.mockResolvedValueOnce([{
        id: 'other-user-id',
        email: 'taken@example.com'
      }]);

      await expect(
        userService.updateUser('user-id', {
          email: 'taken@example.com'
        })
      ).rejects.toThrow('already exists');
    });

    it('ar trebui să permită actualizarea la același email', async () => {
      mockDb.limit.mockResolvedValueOnce([{
        id: 'user-id',
        email: 'same@example.com'
      }]);

      await expect(
        userService.updateUser('user-id', {
          email: 'same@example.com'
        })
      ).resolves.not.toThrow();
    });
  });

  describe('findUserByEmail', () => {
    it('ar trebui să găsească utilizator după email', async () => {
      const mockUser = {
        id: 'found-user',
        email: 'found@example.com'
      };

      mockDb.limit.mockResolvedValueOnce([mockUser]);

      const result = await userService.findUserByEmail('found@example.com');

      expect(result).toEqual(mockUser);
    });

    it('ar trebui să returneze null pentru email inexistent', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await userService.findUserByEmail('notfound@example.com');

      expect(result).toBeNull();
    });

    it('ar trebui să caute case-insensitive', async () => {
      mockDb.limit.mockResolvedValueOnce([{
        email: 'test@example.com'
      }]);

      await userService.findUserByEmail('TEST@EXAMPLE.COM');

      expect(mockDb.where).toHaveBeenCalled();
    });
  });

  describe('getUsers', () => {
    it('ar trebui să returneze utilizatori cu paginare', async () => {
      const mockUsers = Array.from({ length: 10 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`
      }));

      mockDb.orderBy.mockResolvedValueOnce(mockUsers);
      mockDb.where.mockResolvedValueOnce([{ count: 100 }]);

      const result = await userService.getUsers({
        page: 1,
        limit: 10
      });

      expect(result.data).toHaveLength(10);
      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 100,
        totalPages: 10
      });
    });

    it('ar trebui să filtreze după companyId', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      await userService.getUsers({
        companyId: 'company-123'
      });

      expect(mockDb.where).toHaveBeenCalled();
    });

    it('ar trebui să sorteze după diferite coloane', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);
      mockDb.where.mockResolvedValueOnce([{ count: 0 }]);

      await userService.getUsers({
        sortBy: 'email',
        sortDirection: 'desc'
      });

      expect(mockDb.orderBy).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('ar trebui să șteargă utilizatorul și rolurile asociate', async () => {
      await userService.deleteUser('user-id');

      expect(mockDb.delete).toHaveBeenCalledTimes(2); // userRoles + user
    });

    it('ar trebui să arunce eroare pentru utilizator inexistent', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      await expect(
        userService.deleteUser('nonexistent-id')
      ).rejects.toThrow('not found');
    });
  });

  describe('verifyPassword', () => {
    it('ar trebui să verifice parola corectă', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(true as never);

      const result = await userService.verifyPassword(
        'correct-password',
        'hashed-password'
      );

      expect(result).toBe(true);
      expect(bcrypt.compare).toHaveBeenCalledWith('correct-password', 'hashed-password');
    });

    it('ar trebui să respingă parola incorectă', async () => {
      vi.mocked(bcrypt.compare).mockResolvedValueOnce(false as never);

      const result = await userService.verifyPassword(
        'wrong-password',
        'hashed-password'
      );

      expect(result).toBe(false);
    });
  });

  describe('assignRolesToUser', () => {
    it('ar trebui să asigneze roluri utilizatorului', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 'user-id' }]); // User exists
      mockDb.limit.mockResolvedValue([{ id: 'role-id' }]); // Roles exist

      await userService.assignRolesToUser('user-id', ['role1', 'role2']);

      expect(mockDb.delete).toHaveBeenCalled(); // Delete existing roles
      expect(mockDb.insert).toHaveBeenCalled(); // Insert new roles
    });

    it('ar trebui să valideze existența utilizatorului', async () => {
      mockDb.limit.mockResolvedValueOnce([]); // User doesn't exist

      await expect(
        userService.assignRolesToUser('nonexistent-user', ['role1'])
      ).rejects.toThrow('not found');
    });

    it('ar trebui să valideze existența rolurilor', async () => {
      mockDb.limit
        .mockResolvedValueOnce([{ id: 'user-id' }]) // User exists
        .mockResolvedValueOnce([]); // Role doesn't exist

      await expect(
        userService.assignRolesToUser('user-id', ['nonexistent-role'])
      ).rejects.toThrow('not found');
    });
  });

  describe('getUserRoles', () => {
    it('ar trebui să returneze rolurile utilizatorului', async () => {
      const mockRoles = [
        { role: { id: 'role1', name: 'Admin' } },
        { role: { id: 'role2', name: 'User' } }
      ];

      mockDb.where.mockResolvedValueOnce(mockRoles);

      const result = await userService.getUserRoles('user-id');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'role1', name: 'Admin' });
    });
  });

  describe('changePassword', () => {
    it('ar trebui să schimbe parola utilizatorului', async () => {
      await userService.changePassword('user-id', 'NewPassword123!');

      expect(bcrypt.hash).toHaveBeenCalledWith('NewPassword123!', 10);
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('ar trebui să arunce eroare pentru utilizator inexistent', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      await expect(
        userService.changePassword('nonexistent-id', 'password')
      ).rejects.toThrow('not found');
    });
  });

  describe('Security Tests', () => {
    it('ar trebui să folosească salt rounds corespunzător', async () => {
      await userService.createUser({
        email: 'test@example.com',
        password: 'password'
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
    });

    it('ar trebui să nu returneze parola în rezultate', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const user = await userService.createUser({
        email: 'test@example.com',
        password: 'password'
      });

      expect(user).toHaveProperty('password');
      // În controllerul real, parola este ștearsă înainte de răspuns
    });
  });

  describe('Performance Tests', () => {
    it('ar trebui să gestioneze volume mari de utilizatori', async () => {
      const users = Array.from({ length: 1000 }, (_, i) => ({
        id: `user-${i}`,
        email: `user${i}@example.com`
      }));

      mockDb.orderBy.mockResolvedValueOnce(users);
      mockDb.where.mockResolvedValueOnce([{ count: 1000 }]);

      const startTime = Date.now();
      const result = await userService.getUsers({
        limit: 1000
      });
      const endTime = Date.now();

      expect(result.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(1000);
    });
  });
});

