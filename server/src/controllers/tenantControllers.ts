import { Request, Response } from "express";
import { tenantService } from "../services/tenantService";

export const getTenant = async (req: Request, res: Response): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const tenant = await tenantService.getTenantByCognitoId(cognitoId as string);

    if (!tenant) {
      res.status(404).json({ message: "Tenant not found" });
      return;
    }

    res.json(tenant);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving tenant: ${error.message}` });
  }
};

export const createTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, name, email, phoneNumber } = req.body;

    const tenant = await tenantService.createTenant({
      cognitoId,
      name,
      email,
      phoneNumber,
    });

    res.status(201).json(tenant);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating tenant: ${error.message}` });
  }
};

export const updateTenant = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const { name, email, phoneNumber } = req.body;

    const updatedTenant = await tenantService.updateTenant(cognitoId as string, {
      name,
      email,
      phoneNumber,
    });

    res.json(updatedTenant);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating tenant: ${error.message}` });
  }
};

export const getCurrentResidences = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId } = req.params;
    const residences = await tenantService.getCurrentResidences(cognitoId as string);

    res.json(residences);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error retrieving tenant residences: ${err.message}` });
  }
};

export const addFavoriteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, propertyId } = req.params;
    const propertyIdNumber = Number(propertyId);

    const result = await tenantService.addFavoriteProperty(
      cognitoId as string,
      propertyIdNumber
    );

    if ('error' in result) {
      res.status(result.status).json({ message: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error adding favorite property: ${error.message}` });
  }
};

export const removeFavoriteProperty = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { cognitoId, propertyId } = req.params;
    const propertyIdNumber = Number(propertyId);

    const updatedTenant = await tenantService.removeFavoriteProperty(
      cognitoId as string,
      propertyIdNumber
    );

    res.json(updatedTenant);
  } catch (err: any) {
    res
      .status(500)
      .json({ message: `Error removing favorite property: ${err.message}` });
  }
};
