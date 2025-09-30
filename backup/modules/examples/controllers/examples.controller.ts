
import { Request, Response } from 'express';
import { log } from '../../../vite';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '../../auth/types';

export class ExamplesController {
  static publicTest(req: Request, res: Response) {
    return res.status(200).json({
      message: 'Public endpoint - no authentication required'
    });
  }

  static protectedTest(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      message: 'Protected endpoint - authentication required',
      user: {
        id: req.user?.id,
        username: req.user?.username,
        role: req.user?.role
      }
    });
  }

  static optionalAuthTest(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      message: req.user ? 'User authenticated' : 'No user auth',
      user: req.user || null
    });
  }

  static adminTest(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Admin only route',
      user: req.user
    });
  }

  static companyTest(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Company specific route',
      user: req.user,
      companyId: req.params.companyId
    });
  }

  static managerTest(req: AuthenticatedRequest, res: Response) {
    return res.status(200).json({
      success: true,
      message: 'Manager route - Admin or Company Admin only',
      user: req.user
    });
  }

  static tokenInfo(req: Request, res: Response) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(200).json({
        success: false,
        message: 'No token provided'
      });
    }

    const parts = authHeader.split(' ');
    const token = parts.length > 1 ? parts[1] : parts[0];

    try {
      const decoded = jwt.decode(token);
      return res.status(200).json({
        success: true,
        message: 'Token info',
        token,
        decoded
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to decode token',
        error: (error as Error).message
      });
    }
  }
}
