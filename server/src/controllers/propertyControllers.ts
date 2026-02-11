import { Request, Response } from "express";
import { propertyService } from "../services/propertyService";

export const getProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const properties = await propertyService.getProperties(req.query as any);
    res.json(properties);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving properties: ${error.message}` });
  }
};

export const getProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const property = await propertyService.getPropertyById(Number(id));

    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }

    res.json(property);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving property: ${err.message}` });
  }
};

export const createProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      res.status(400).json({ message: "No photos uploaded" });
      return;
    }

    console.log('Files received:', files.map(f => ({ 
      name: f.originalname, 
      size: f.size, 
      hasBuffer: !!f.buffer 
    })));

    const {
      address,
      city,
      state,
      country,
      postalCode,
      managerCognitoId,
      ...propertyData
    } = req.body;

    const locationData = {
      address,
      city,
      state,
      country,
      postalCode,
    };

    const newProperty = await propertyService.createProperty(
      files,
      locationData,
      { ...propertyData, managerCognitoId }
    );

    res.status(201).json(newProperty);
  } catch (err: any) {
    console.error('Error creating property:', err);
    res
      .status(500)
      .json({ message: `Error creating property: ${err.message}` });
  }
};