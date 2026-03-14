// Catálogo de marcas y modelos de vehículos disponibles en Uruguay
// Organizado alfabéticamente. Incluye marcas y modelos más comunes en el mercado uruguayo.

export interface VehicleModel {
  name: string;
}

export interface VehicleMake {
  name: string;
  models: VehicleModel[];
}

export const VEHICLE_MAKES: VehicleMake[] = [
  {
    name: "Audi",
    models: [
      { name: "A1" },
      { name: "A3" },
      { name: "A4" },
      { name: "A5" },
      { name: "Q2" },
      { name: "Q3" },
      { name: "Q5" },
      { name: "Q7" },
    ],
  },
  {
    name: "BMW",
    models: [
      { name: "118i" },
      { name: "218i" },
      { name: "320i" },
      { name: "330i" },
      { name: "X1" },
      { name: "X2" },
      { name: "X3" },
      { name: "X5" },
    ],
  },
  {
    name: "BYD",
    models: [
      { name: "Dolphin" },
      { name: "Dolphin Mini" },
      { name: "Seal" },
      { name: "Song Plus" },
      { name: "Yuan Plus" },
    ],
  },
  {
    name: "Chery",
    models: [
      { name: "Arrizo 5" },
      { name: "Tiggo 2" },
      { name: "Tiggo 3" },
      { name: "Tiggo 4" },
      { name: "Tiggo 7" },
      { name: "Tiggo 8" },
    ],
  },
  {
    name: "Chevrolet",
    models: [
      { name: "Cruze" },
      { name: "Equinox" },
      { name: "Montana" },
      { name: "Onix" },
      { name: "S10" },
      { name: "Spin" },
      { name: "Tracker" },
      { name: "Trailblazer" },
    ],
  },
  {
    name: "Citroën",
    models: [
      { name: "Berlingo" },
      { name: "C3" },
      { name: "C3 Aircross" },
      { name: "C4 Cactus" },
      { name: "C5 Aircross" },
    ],
  },
  {
    name: "Dodge",
    models: [
      { name: "Durango" },
      { name: "Journey" },
      { name: "RAM 1500" },
      { name: "RAM 2500" },
    ],
  },
  {
    name: "Fiat",
    models: [
      { name: "Argo" },
      { name: "Cronos" },
      { name: "Fastback" },
      { name: "Mobi" },
      { name: "Pulse" },
      { name: "Strada" },
      { name: "Toro" },
    ],
  },
  {
    name: "Ford",
    models: [
      { name: "Bronco Sport" },
      { name: "EcoSport" },
      { name: "Escape" },
      { name: "Ka" },
      { name: "Maverick" },
      { name: "Ranger" },
      { name: "Territory" },
    ],
  },
  {
    name: "Haval",
    models: [
      { name: "Dargo" },
      { name: "H6" },
      { name: "Jolion" },
    ],
  },
  {
    name: "Honda",
    models: [
      { name: "City" },
      { name: "Civic" },
      { name: "CR-V" },
      { name: "Fit" },
      { name: "HR-V" },
      { name: "WR-V" },
      { name: "ZR-V" },
    ],
  },
  {
    name: "Hyundai",
    models: [
      { name: "Bayon" },
      { name: "Creta" },
      { name: "HB20" },
      { name: "i20" },
      { name: "Kona" },
      { name: "Santa Fe" },
      { name: "Tucson" },
      { name: "Venue" },
    ],
  },
  {
    name: "JAC",
    models: [
      { name: "E-JS1" },
      { name: "J7" },
      { name: "S4" },
      { name: "T6" },
      { name: "T8" },
    ],
  },
  {
    name: "Jeep",
    models: [
      { name: "Commander" },
      { name: "Compass" },
      { name: "Gladiator" },
      { name: "Renegade" },
      { name: "Wrangler" },
    ],
  },
  {
    name: "Kia",
    models: [
      { name: "Carnival" },
      { name: "Cerato" },
      { name: "Niro" },
      { name: "Picanto" },
      { name: "Rio" },
      { name: "Seltos" },
      { name: "Sonet" },
      { name: "Sorento" },
      { name: "Sportage" },
      { name: "Stonic" },
    ],
  },
  {
    name: "Mercedes-Benz",
    models: [
      { name: "Clase A" },
      { name: "Clase C" },
      { name: "Clase E" },
      { name: "CLA" },
      { name: "GLA" },
      { name: "GLB" },
      { name: "GLC" },
      { name: "GLE" },
      { name: "Sprinter" },
      { name: "Vito" },
    ],
  },
  {
    name: "Mitsubishi",
    models: [
      { name: "ASX" },
      { name: "Eclipse Cross" },
      { name: "L200" },
      { name: "Outlander" },
      { name: "Outlander Sport" },
    ],
  },
  {
    name: "Nissan",
    models: [
      { name: "Frontier" },
      { name: "Kicks" },
      { name: "Leaf" },
      { name: "March" },
      { name: "Sentra" },
      { name: "Versa" },
      { name: "X-Trail" },
    ],
  },
  {
    name: "Peugeot",
    models: [
      { name: "208" },
      { name: "2008" },
      { name: "308" },
      { name: "3008" },
      { name: "408" },
      { name: "5008" },
      { name: "Partner" },
    ],
  },
  {
    name: "Renault",
    models: [
      { name: "Alaskan" },
      { name: "Captur" },
      { name: "Duster" },
      { name: "Kangoo" },
      { name: "Kwid" },
      { name: "Logan" },
      { name: "Oroch" },
      { name: "Sandero" },
      { name: "Stepway" },
      { name: "Symbioz" },
    ],
  },
  {
    name: "Subaru",
    models: [
      { name: "Crosstrek" },
      { name: "Forester" },
      { name: "Impreza" },
      { name: "Outback" },
      { name: "WRX" },
      { name: "XV" },
    ],
  },
  {
    name: "Suzuki",
    models: [
      { name: "Baleno" },
      { name: "Fronx" },
      { name: "Grand Vitara" },
      { name: "Jimny" },
      { name: "S-Cross" },
      { name: "Swift" },
      { name: "Vitara" },
    ],
  },
  {
    name: "Toyota",
    models: [
      { name: "Camry" },
      { name: "Corolla" },
      { name: "Corolla Cross" },
      { name: "Etios" },
      { name: "GR86" },
      { name: "Hilux" },
      { name: "Land Cruiser" },
      { name: "RAV4" },
      { name: "SW4" },
      { name: "Yaris" },
      { name: "Yaris Cross" },
    ],
  },
  {
    name: "Volkswagen",
    models: [
      { name: "Amarok" },
      { name: "Gol" },
      { name: "Golf" },
      { name: "Nivus" },
      { name: "Polo" },
      { name: "Saveiro" },
      { name: "T-Cross" },
      { name: "Taos" },
      { name: "Tiguan" },
      { name: "Vento" },
      { name: "Virtus" },
    ],
  },
  {
    name: "Volvo",
    models: [
      { name: "C40" },
      { name: "EX30" },
      { name: "XC40" },
      { name: "XC60" },
      { name: "XC90" },
    ],
  },
];

/** Valor especial para "Otra marca" / "Otro modelo" */
export const OTHER_OPTION = "__other__";

/** Lista plana de nombres de marcas para búsquedas rápidas */
export const VEHICLE_MAKE_NAMES = VEHICLE_MAKES.map((m) => m.name);

/** Obtiene los modelos de una marca por nombre */
export function getModelsForMake(makeName: string): string[] {
  const make = VEHICLE_MAKES.find(
    (m) => m.name.toLowerCase() === makeName.toLowerCase()
  );
  return make ? make.models.map((m) => m.name) : [];
}
