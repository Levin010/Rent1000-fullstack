import { wktToGeoJSON } from "@terraformer/wkt";
import { prisma } from '../lib/prisma';

interface TenantData {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface TenantUpdateData {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export class TenantService {
  async getTenantByCognitoId(cognitoId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: {
        favorites: true,
      },
    });

    return tenant;
  }

  async createTenant(data: TenantData) {
    const tenant = await prisma.tenant.create({
      data: {
        cognitoId: data.cognitoId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    return tenant;
  }

  async updateTenant(cognitoId: string, data: TenantUpdateData) {
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    return updatedTenant;
  }

  async formatPropertyLocation(property: any) {
    const coordinates: { coordinates: string }[] =
      await prisma.$queryRaw`SELECT ST_asText(coordinates) as coordinates from "Location" where id = ${property.location.id}`;

    const geoJSON: any = wktToGeoJSON(coordinates[0]?.coordinates || "");
    const longitude = geoJSON.coordinates[0];
    const latitude = geoJSON.coordinates[1];

    return {
      ...property,
      location: {
        ...property.location,
        coordinates: {
          longitude,
          latitude,
        },
      },
    };
  }

  async getCurrentResidences(cognitoId: string) {
    const properties = await prisma.property.findMany({
      where: { tenants: { some: { cognitoId } } },
      include: {
        location: true,
      },
    });

    const residencesWithFormattedLocation = await Promise.all(
      properties.map((property) => this.formatPropertyLocation(property))
    );

    return residencesWithFormattedLocation;
  }

  async addFavoriteProperty(cognitoId: string, propertyId: number) {
    const tenant = await prisma.tenant.findUnique({
      where: { cognitoId },
      include: { favorites: true },
    });

    if (!tenant) {
      return { error: "Tenant not found", status: 404 };
    }

    const existingFavorites = tenant.favorites || [];

    if (existingFavorites.some((fav) => fav.id === propertyId)) {
      return { error: "Property already added as favorite", status: 409 };
    }

    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        favorites: {
          connect: { id: propertyId },
        },
      },
      include: { favorites: true },
    });

    return { data: updatedTenant, status: 200 };
  }

  async removeFavoriteProperty(cognitoId: string, propertyId: number) {
    const updatedTenant = await prisma.tenant.update({
      where: { cognitoId },
      data: {
        favorites: {
          disconnect: { id: propertyId },
        },
      },
      include: { favorites: true },
    });

    return updatedTenant;
  }
}

export const tenantService = new TenantService();