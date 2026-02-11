import { wktToGeoJSON } from "@terraformer/wkt";
import { prisma } from '../lib/prisma';

interface ManagerData {
  cognitoId: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface ManagerUpdateData {
  name?: string;
  email?: string;
  phoneNumber?: string;
}

export class ManagerService {
  async getManagerByCognitoId(cognitoId: string) {
    const manager = await prisma.manager.findUnique({
      where: { cognitoId },
    });

    return manager;
  }

  async createManager(data: ManagerData) {
    const manager = await prisma.manager.create({
      data: {
        cognitoId: data.cognitoId,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    return manager;
  }

  async updateManager(cognitoId: string, data: ManagerUpdateData) {
    const updatedManager = await prisma.manager.update({
      where: { cognitoId },
      data: {
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
      },
    });

    return updatedManager;
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

  async getManagerProperties(cognitoId: string) {
    const properties = await prisma.property.findMany({
      where: { managerCognitoId: cognitoId },
      include: {
        location: true,
      },
    });

    const propertiesWithFormattedLocation = await Promise.all(
      properties.map((property) => this.formatPropertyLocation(property))
    );

    return propertiesWithFormattedLocation;
  }
}

export const managerService = new ManagerService();