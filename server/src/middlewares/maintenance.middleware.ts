import { Request, Response, NextFunction } from 'express';
import { PlatformSettings } from '../models/platformSettings.model';

export const maintenanceMode = async (req: Request, res: Response, next: NextFunction) => {
  if (req.path.startsWith('/admin') || req.path.startsWith('/auth')) {
    return next();
  }

  try {
    const settings = await PlatformSettings.findOne().lean();
    if (settings?.maintenanceMode) {
      const isAdmin = req.currentUser?.role === 'admin';
      if (!isAdmin) {
        return res.status(503).json({
          success: false,
          message: 'Platform is under maintenance. Please try again later.',
        });
      }
    }
    next();
  } catch {
    next();
  }
};
