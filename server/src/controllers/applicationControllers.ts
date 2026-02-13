import { Request, Response } from "express";
import { applicationService } from "../services/applicationService";

export const listApplications = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userId, userType } = req.query;

    const applications = await applicationService.listApplications({
      userId: userId as string,
      userType: userType as string,
    });

    res.json(applications);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving applications: ${error.message}` });
  }
};

export const createApplication = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      applicationDate,
      status,
      propertyId,
      tenantCognitoId,
      name,
      email,
      phoneNumber,
      message,
    } = req.body;

    const result = await applicationService.createApplication({
      applicationDate,
      status,
      propertyId,
      tenantCognitoId,
      name,
      email,
      phoneNumber,
      message,
    });

    if ('error' in result) {
      res.status(result.status).json({ message: result.error });
      return;
    }

    res.status(result.status).json(result.data);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating application: ${error.message}` });
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    console.log("status:", status);

    const result = await applicationService.updateApplicationStatus(
      Number(id),
      status
    );

    if ('error' in result) {
      res.status(result.status).json({ message: result.error });
      return;
    }

    res.json(result.data);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error updating application status: ${error.message}` });
  }
};