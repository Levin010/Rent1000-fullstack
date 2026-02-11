import { Prisma, Amenity, Highlight, PropertyType } from "@prisma/client";
import { S3Client } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import axios from "axios";
import { prisma } from '../lib/prisma';
import { wktToGeoJSON } from "@terraformer/wkt";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

interface PropertyFilters {
  favoriteIds?: string;
  priceMin?: string;
  priceMax?: string;
  beds?: string;
  baths?: string;
  propertyType?: string;
  squareFeetMin?: string;
  squareFeetMax?: string;
  amenities?: string;
  availableFrom?: string;
  latitude?: string;
  longitude?: string;
}

interface LocationData {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

interface PropertyData {
  name: string;
  description: string;
  propertyType: string;
  managerCognitoId: string;
  amenities?: string;
  highlights?: string;
  isPetsAllowed?: string;
  isParkingIncluded?: string;
  pricePerMonth: string;
  securityDeposit: string;
  applicationFee: string;
  beds: string;
  baths: string;
  squareFeet: string;
  [key: string]: any;
}

export class PropertyService {
  async getProperties(filters: PropertyFilters) {
    const {
      favoriteIds,
      priceMin,
      priceMax,
      beds,
      baths,
      propertyType,
      squareFeetMin,
      squareFeetMax,
      amenities,
      availableFrom,
      latitude,
      longitude,
    } = filters;

    let whereConditions: Prisma.Sql[] = [];

    if (favoriteIds) {
      const favoriteIdsArray = favoriteIds.split(",").map(Number);
      whereConditions.push(
        Prisma.sql`p.id IN (${Prisma.join(favoriteIdsArray)})`
      );
    }

    if (priceMin) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" >= ${Number(priceMin)}`
      );
    }

    if (priceMax) {
      whereConditions.push(
        Prisma.sql`p."pricePerMonth" <= ${Number(priceMax)}`
      );
    }

    if (beds && beds !== "any") {
      whereConditions.push(Prisma.sql`p.beds >= ${Number(beds)}`);
    }

    if (baths && baths !== "any") {
      whereConditions.push(Prisma.sql`p.baths >= ${Number(baths)}`);
    }

    if (squareFeetMin) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" >= ${Number(squareFeetMin)}`
      );
    }

    if (squareFeetMax) {
      whereConditions.push(
        Prisma.sql`p."squareFeet" <= ${Number(squareFeetMax)}`
      );
    }

    if (propertyType && propertyType !== "any") {
      whereConditions.push(
        Prisma.sql`p."propertyType" = ${propertyType}::"PropertyType"`
      );
    }

    if (amenities && amenities !== "any") {
      const amenitiesArray = amenities.split(",");
      whereConditions.push(Prisma.sql`p.amenities @> ${amenitiesArray}`);
    }

    if (availableFrom && availableFrom !== "any") {
      const date = new Date(availableFrom);
      if (!isNaN(date.getTime())) {
        whereConditions.push(
          Prisma.sql`EXISTS (
            SELECT 1 FROM "Lease" l 
            WHERE l."propertyId" = p.id 
            AND l."startDate" <= ${date.toISOString()}
          )`
        );
      }
    }

    if (latitude && longitude) {
      const lat = parseFloat(latitude);
      const lng = parseFloat(longitude);
      const radiusInKilometers = 1000;
      const degrees = radiusInKilometers / 111;

      whereConditions.push(
        Prisma.sql`ST_DWithin(
          l.coordinates::geometry,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
          ${degrees}
        )`
      );
    }

    const completeQuery = Prisma.sql`
      SELECT 
        p.*,
        json_build_object(
          'id', l.id,
          'address', l.address,
          'city', l.city,
          'state', l.state,
          'country', l.country,
          'postalCode', l."postalCode",
          'coordinates', json_build_object(
            'longitude', ST_X(l."coordinates"::geometry),
            'latitude', ST_Y(l."coordinates"::geometry)
          )
        ) as location
      FROM "Property" p
      JOIN "Location" l ON p."locationId" = l.id
      ${
        whereConditions.length > 0
          ? Prisma.sql`WHERE ${Prisma.join(whereConditions, " AND ")}`
          : Prisma.empty
      }
    `;

    return await prisma.$queryRaw(completeQuery);
  }

  async getPropertyById(id: number) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        location: true,
      },
    });

    if (!property) {
      return null;
    }

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

  async uploadPhotosToS3(files: Express.Multer.File[]): Promise<string[]> {
    return await Promise.all(
      files.map(async (file) => {
        const uploadParams = {
          Bucket: process.env.S3_BUCKET_NAME!,
          Key: `properties/${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        };

        const uploadResult = await new Upload({
          client: s3Client,
          params: uploadParams,
        }).done();

        return uploadResult.Location || "";
      })
    );
  }

  async geocodeAddress(locationData: LocationData): Promise<{
    longitude: number;
    latitude: number;
  }> {
    const geocodingUrl = `https://nominatim.openstreetmap.org/search?${new URLSearchParams(
      {
        street: locationData.address,
        city: locationData.city,
        country: locationData.country,
        postalcode: locationData.postalCode,
        format: "json",
        limit: "1",
      }
    ).toString()}`;

    const geocodingResponse = await axios.get(geocodingUrl, {
      headers: {
        "User-Agent": "RealEstateApp (levdev1010@gmail.com)",
      },
    });

    const [longitude, latitude] =
      geocodingResponse.data[0]?.lon && geocodingResponse.data[0]?.lat
        ? [
            parseFloat(geocodingResponse.data[0].lon),
            parseFloat(geocodingResponse.data[0].lat),
          ]
        : [0, 0];

    return { longitude, latitude };
  }

  async createLocation(
    locationData: LocationData,
    coordinates: { longitude: number; latitude: number }
  ) {
    const [location] = await prisma.$queryRaw<any[]>`
      INSERT INTO "Location" (address, city, state, country, "postalCode", coordinates)
      VALUES (
        ${locationData.address}, 
        ${locationData.city}, 
        ${locationData.state}, 
        ${locationData.country}, 
        ${locationData.postalCode}, 
        ST_SetSRID(ST_MakePoint(${coordinates.longitude}, ${coordinates.latitude}), 4326)
      )
      RETURNING id, address, city, state, country, "postalCode", ST_AsText(coordinates) as coordinates;
    `;

    return location;
  }

  async createProperty(
    files: Express.Multer.File[],
    locationData: LocationData,
    propertyData: PropertyData
  ) {
    // Upload photos to S3
    const photoUrls = await this.uploadPhotosToS3(files);

    // Geocode address
    const coordinates = await this.geocodeAddress(locationData);

    // Create location
    const location = await this.createLocation(locationData, coordinates);

    // Create property
    const newProperty = await prisma.property.create({
      data: {
        name: propertyData.name,
        description: propertyData.description,
        propertyType: propertyData.propertyType  as PropertyType,
        photoUrls,
        locationId: location.id,
        managerCognitoId: propertyData.managerCognitoId,
        amenities:
          typeof propertyData.amenities === "string"
            ? (propertyData.amenities.split(",") as Amenity[])
            : [],
        highlights:
          typeof propertyData.highlights === "string"
            ? (propertyData.highlights.split(",") as Highlight[])
            : [],
        isPetsAllowed: propertyData.isPetsAllowed === "true",
        isParkingIncluded: propertyData.isParkingIncluded === "true",
        pricePerMonth: parseFloat(propertyData.pricePerMonth),
        securityDeposit: parseFloat(propertyData.securityDeposit),
        applicationFee: parseFloat(propertyData.applicationFee),
        beds: parseInt(propertyData.beds),
        baths: parseFloat(propertyData.baths),
        squareFeet: parseInt(propertyData.squareFeet),
      },
      include: {
        location: true,
        manager: true,
      },
    });

    return newProperty;
  }

  async updateProperty(
  id: number,
  files: Express.Multer.File[] | undefined,
  locationData: LocationData | undefined,
  propertyData: Partial<PropertyData>
) {
  // Check if property exists
  const existingProperty = await prisma.property.findUnique({
    where: { id },
    include: { location: true },
  });

  if (!existingProperty) {
    return { error: "Property not found", status: 404 };
  }

  let photoUrls = existingProperty.photoUrls;
  let locationId = existingProperty.locationId;

  // Upload new photos if provided
  if (files && files.length > 0) {
    const newPhotoUrls = await this.uploadPhotosToS3(files);
    photoUrls = [...existingProperty.photoUrls, ...newPhotoUrls];
  }

  // Update location if provided
  if (locationData) {
    const coordinates = await this.geocodeAddress(locationData);
    const newLocation = await this.createLocation(locationData, coordinates);
    locationId = newLocation.id;
  }

  // Prepare update data
  const updateData: any = {
    photoUrls,
    locationId,
  };

  // Add optional fields if provided
  if (propertyData.name) updateData.name = propertyData.name;
  if (propertyData.description) updateData.description = propertyData.description;
  if (propertyData.propertyType) updateData.propertyType = propertyData.propertyType as PropertyType;
  
  if (propertyData.amenities !== undefined) {
    updateData.amenities = typeof propertyData.amenities === "string"
      ? (propertyData.amenities.split(",") as Amenity[])
      : [];
  }
  
  if (propertyData.highlights !== undefined) {
    updateData.highlights = typeof propertyData.highlights === "string"
      ? (propertyData.highlights.split(",") as Highlight[])
      : [];
  }
  
  if (propertyData.isPetsAllowed !== undefined) {
    updateData.isPetsAllowed = propertyData.isPetsAllowed === "true";
  }
  
  if (propertyData.isParkingIncluded !== undefined) {
    updateData.isParkingIncluded = propertyData.isParkingIncluded === "true";
  }
  
  if (propertyData.pricePerMonth) {
    updateData.pricePerMonth = parseFloat(propertyData.pricePerMonth);
  }
  
  if (propertyData.securityDeposit) {
    updateData.securityDeposit = parseFloat(propertyData.securityDeposit);
  }
  
  if (propertyData.applicationFee) {
    updateData.applicationFee = parseFloat(propertyData.applicationFee);
  }
  
  if (propertyData.beds) updateData.beds = parseInt(propertyData.beds);
  if (propertyData.baths) updateData.baths = parseFloat(propertyData.baths);
  if (propertyData.squareFeet) updateData.squareFeet = parseInt(propertyData.squareFeet);

  // Update property
  const updatedProperty = await prisma.property.update({
    where: { id },
    data: updateData,
    include: {
      location: true,
      manager: true,
    },
  });

  return { data: updatedProperty, status: 200 };
}

async deleteProperty(id: number) {
  // Check if property exists
  const property = await prisma.property.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          applications: true,
          leases: true,
        },
      },
    },
  });

  if (!property) {
    return { error: "Property not found", status: 404 };
  }

  // Check if property has active applications or leases
  if (property._count.applications > 0 || property._count.leases > 0) {
    return {
      error: "Cannot delete property with active applications or leases",
      status: 400,
    };
  }

  // Delete the property
  await prisma.property.delete({
    where: { id },
  });

  return { data: { message: "Property deleted successfully" }, status: 200 };
}
}

export const propertyService = new PropertyService();