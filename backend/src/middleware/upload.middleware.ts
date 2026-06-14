import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';

// Créer le dossier uploads s'il n'existe pas
const uploadsDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `product-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const multerUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// Middleware pour parser le FormData et convertir les valeurs
export const uploadProductImage = multerUpload.single('imageFile');

// Middleware supplémentaire pour s'assurer que req.body contient tous les champs
export const parseFormDataFields = (req: Request, res: Response, next: NextFunction) => {
  // Multer parse déjà les champs texte du FormData dans req.body
  // Mais on doit s'assurer que les valeurs sont correctement converties
  if (req.body) {
    // Debug: afficher les valeurs reçues avant conversion
    console.log('parseFormDataFields - Raw body:', {
      unitId: req.body.unitId,
      purchaseUnitId: req.body.purchaseUnitId,
      categoryId: req.body.categoryId,
      type_unitId: typeof req.body.unitId,
      type_purchaseUnitId: typeof req.body.purchaseUnitId,
      type_categoryId: typeof req.body.categoryId
    });
    
    // Convertir les foreign keys en nombres si elles existent
    if (req.body.unitId !== undefined && req.body.unitId !== null && req.body.unitId !== '') {
      const parsed = parseInt(String(req.body.unitId), 10);
      req.body.unitId = isNaN(parsed) ? null : parsed;
    }
    if (req.body.purchaseUnitId !== undefined && req.body.purchaseUnitId !== null && req.body.purchaseUnitId !== '') {
      const parsed = parseInt(String(req.body.purchaseUnitId), 10);
      req.body.purchaseUnitId = isNaN(parsed) ? null : parsed;
    }
    if (req.body.categoryId !== undefined && req.body.categoryId !== null && req.body.categoryId !== '') {
      const parsed = parseInt(String(req.body.categoryId), 10);
      req.body.categoryId = isNaN(parsed) ? null : parsed;
    }
    
    // Helper function pour parser les nombres avec support des virgules
    const parseDecimal = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remplacer les virgules par des points pour le parsing
        const normalized = value.replace(',', '.');
        return parseFloat(normalized) || 0;
      }
      return 0;
    };
    
    // Convertir les nombres
    if (req.body.price !== undefined) req.body.price = parseDecimal(req.body.price);
    if (req.body.wholesalePrice !== undefined) req.body.wholesalePrice = parseDecimal(req.body.wholesalePrice);
    if (req.body.wholesaleThreshold !== undefined) req.body.wholesaleThreshold = parseInt(String(req.body.wholesaleThreshold), 10) || 0;
    if (req.body.costPrice !== undefined) req.body.costPrice = parseDecimal(req.body.costPrice);
    if (req.body.stockMagasin !== undefined) req.body.stockMagasin = parseInt(String(req.body.stockMagasin), 10) || 0;
    if (req.body.stockPrincipal !== undefined) req.body.stockPrincipal = parseInt(String(req.body.stockPrincipal), 10) || 0;
    if (req.body.minStock !== undefined) req.body.minStock = parseInt(String(req.body.minStock), 10) || 0;
    if (req.body.conversionRatio !== undefined) req.body.conversionRatio = parseDecimal(req.body.conversionRatio);
    if (req.body.isFavorite !== undefined) {
      req.body.isFavorite = req.body.isFavorite === 'true' || req.body.isFavorite === true;
    }
    
    // Parser les conversions d'unités si elles sont fournies (JSON stringifié)
    if (req.body.unitConversions !== undefined && req.body.unitConversions !== null) {
      try {
        let parsedConversions;
        if (typeof req.body.unitConversions === 'string') {
          parsedConversions = JSON.parse(req.body.unitConversions);
        } else if (Array.isArray(req.body.unitConversions)) {
          parsedConversions = req.body.unitConversions;
        } else {
          parsedConversions = [];
        }
        
        // Convertir les valeurs numériques dans chaque conversion
        // Helper function pour parser les nombres avec support des virgules
        const parseDecimal = (value: any): number => {
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            // Remplacer les virgules par des points pour le parsing
            const normalized = value.replace(',', '.');
            return parseFloat(normalized) || 0;
          }
          return 0;
        };
        
        req.body.unitConversions = parsedConversions.map((conv: any) => ({
          id: conv.id ? (typeof conv.id === 'string' ? parseInt(conv.id, 10) : conv.id) : undefined,
          unitId: typeof conv.unitId === 'string' ? parseInt(conv.unitId, 10) : (conv.unitId || 0),
          conversionRatio: typeof conv.conversionRatio === 'string' 
            ? parseDecimal(conv.conversionRatio)
            : (conv.conversionRatio || 1),
          customPrice: conv.customPrice !== null && conv.customPrice !== undefined && conv.customPrice !== ''
            ? (typeof conv.customPrice === 'string' ? parseDecimal(conv.customPrice) : conv.customPrice)
            : null,
          isDefault: conv.isDefault === 'true' || conv.isDefault === true || conv.isDefault === 1,
        }));
        
        console.log('parseFormDataFields - Parsed unitConversions:', req.body.unitConversions);
      } catch (error) {
        console.error('parseFormDataFields - Error parsing unitConversions:', error);
        req.body.unitConversions = [];
      }
    }
    
    // Debug: afficher les valeurs après conversion
    console.log('parseFormDataFields - Converted body:', {
      unitId: req.body.unitId,
      purchaseUnitId: req.body.purchaseUnitId,
      categoryId: req.body.categoryId,
      type_unitId: typeof req.body.unitId,
      type_purchaseUnitId: typeof req.body.purchaseUnitId,
      type_categoryId: typeof req.body.categoryId,
      hasUnitConversions: !!req.body.unitConversions,
      unitConversionsCount: req.body.unitConversions ? req.body.unitConversions.length : 0
    });
  }
  next();
};

