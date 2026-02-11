import { prisma } from '../lib/prisma';
import { ApplicationStatus } from '@prisma/client';

interface ApplicationFilters {
  userId?: string;
  userType?: string;
}

interface CreateApplicationData {
  applicationDate: string;
  status: string;
  propertyId: number;
  tenantCognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
  message: string;
}

export class ApplicationService {
  calculateNextPaymentDate(startDate: Date): Date {
    const today = new Date();
    const nextPaymentDate = new Date(startDate);
    while (nextPaymentDate <= today) {
      nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
    }
    return nextPaymentDate;
  }

  buildWhereClause(filters: ApplicationFilters) {
    let whereClause = {};

    if (filters.userId && filters.userType) {
      if (filters.userType === "tenant") {
        whereClause = { tenantCognitoId: String(filters.userId) };
      } else if (filters.userType === "manager") {
        whereClause = {
          property: {
            managerCognitoId: String(filters.userId),
          },
        };
      }
    }

    return whereClause;
  }

  async listApplications(filters: ApplicationFilters) {
    const whereClause = this.buildWhereClause(filters);

    const applications = await prisma.application.findMany({
      where: whereClause,
      include: {
        property: {
          include: {
            location: true,
            manager: true,
          },
        },
        tenant: true,
      },
    });

    const formattedApplications = await Promise.all(
      applications.map(async (app) => {
        const lease = await prisma.lease.findFirst({
          where: {
            tenant: {
              cognitoId: app.tenantCognitoId,
            },
            propertyId: app.propertyId,
          },
          orderBy: { startDate: "desc" },
        });

        return {
          ...app,
          property: {
            ...app.property,
            address: app.property.location.address,
          },
          manager: app.property.manager,
          lease: lease
            ? {
                ...lease,
                nextPaymentDate: this.calculateNextPaymentDate(lease.startDate),
              }
            : null,
        };
      })
    );

    return formattedApplications;
  }

  async createApplication(data: CreateApplicationData) {
    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { pricePerMonth: true, securityDeposit: true },
    });

    if (!property) {
      return { error: "Property not found", status: 404 };
    }

    const newApplication = await prisma.$transaction(async (prisma) => {
      // Create lease first
      const lease = await prisma.lease.create({
        data: {
          startDate: new Date(),
          endDate: new Date(
            new Date().setFullYear(new Date().getFullYear() + 1)
          ),
          rent: property.pricePerMonth,
          deposit: property.securityDeposit,
          property: {
            connect: { id: data.propertyId },
          },
          tenant: {
            connect: { cognitoId: data.tenantCognitoId },
          },
        },
      });

      // Then create application with lease connection
      const application = await prisma.application.create({
        data: {
          applicationDate: new Date(data.applicationDate),
          status: data.status as ApplicationStatus,
          name: data.name,
          email: data.email,
          phoneNumber: data.phoneNumber,
          message: data.message,
          property: {
            connect: { id: data.propertyId },
          },
          tenant: {
            connect: { cognitoId: data.tenantCognitoId },
          },
          lease: {
            connect: { id: lease.id },
          },
        },
        include: {
          property: true,
          tenant: true,
          lease: true,
        },
      });

      return application;
    });

    return { data: newApplication, status: 201 };
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus) {
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
      },
    });

    if (!application) {
      return { error: "Application not found", status: 404 };
    }

    if (status === "Approved") {
      await this.approveApplication(application, id, status);
    } else {
      await this.updateStatus(id, status);
    }

    const updatedApplication = await prisma.application.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        lease: true,
      },
    });

    return { data: updatedApplication, status: 200 };
  }

  private async approveApplication(application: any, id: number, status: ApplicationStatus) {
    const newLease = await prisma.lease.create({
      data: {
        startDate: new Date(),
        endDate: new Date(
          new Date().setFullYear(new Date().getFullYear() + 1)
        ),
        rent: application.property.pricePerMonth,
        deposit: application.property.securityDeposit,
        propertyId: application.propertyId,
        tenantCognitoId: application.tenantCognitoId,
      },
    });

    await prisma.property.update({
      where: { id: application.propertyId },
      data: {
        tenants: {
          connect: { cognitoId: application.tenantCognitoId },
        },
      },
    });

    await prisma.application.update({
      where: { id },
      data: { status, leaseId: newLease.id },
      include: {
        property: true,
        tenant: true,
        lease: true,
      },
    });
  }

  private async updateStatus(id: number, status: ApplicationStatus) {
    await prisma.application.update({
      where: { id },
      data: { status },
    });
  }
}

export const applicationService = new ApplicationService();