import { FuelType } from '../../types/entities';

export interface VehicleFormData {
  name: string;
  make: string;
  model: string;
  year: string;
  fuelType: FuelType | '';
  engineSize: string;
}

export interface VehicleValidationErrors {
  name?: string;
  make?: string;
  model?: string;
  year?: string;
  fuelType?: string;
  engineSize?: string;
}

export const validateVehicleForm = (data: VehicleFormData): VehicleValidationErrors => {
  const errors: VehicleValidationErrors = {};

  // Name validation
  if (!data.name.trim()) {
    errors.name = 'Nome do veículo é obrigatório';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Nome deve ter pelo menos 2 caracteres';
  } else if (data.name.trim().length > 50) {
    errors.name = 'Nome deve ter no máximo 50 caracteres';
  }

  // Make validation
  if (!data.make.trim()) {
    errors.make = 'Marca é obrigatória';
  } else if (data.make.trim().length < 2) {
    errors.make = 'Marca deve ter pelo menos 2 caracteres';
  } else if (data.make.trim().length > 30) {
    errors.make = 'Marca deve ter no máximo 30 caracteres';
  }

  // Model validation
  if (!data.model.trim()) {
    errors.model = 'Modelo é obrigatório';
  } else if (data.model.trim().length < 1) {
    errors.model = 'Modelo deve ter pelo menos 1 caractere';
  } else if (data.model.trim().length > 30) {
    errors.model = 'Modelo deve ter no máximo 30 caracteres';
  }

  // Year validation
  if (!data.year.trim()) {
    errors.year = 'Ano é obrigatório';
  } else {
    const yearNum = parseInt(data.year, 10);
    const currentYear = new Date().getFullYear();
    
    if (isNaN(yearNum)) {
      errors.year = 'Ano deve ser um número válido';
    } else if (yearNum < 1990) {
      errors.year = 'Ano deve ser 1990 ou posterior';
    } else if (yearNum > currentYear + 1) {
      errors.year = `Ano não pode ser superior a ${currentYear + 1}`;
    }
  }

  // Fuel type validation
  if (!data.fuelType) {
    errors.fuelType = 'Tipo de combustível é obrigatório';
  } else {
    const validFuelTypes: FuelType[] = ['gasoline', 'ethanol', 'diesel', 'flex'];
    if (!validFuelTypes.includes(data.fuelType as FuelType)) {
      errors.fuelType = 'Tipo de combustível inválido';
    }
  }

  // Engine size validation
  if (!data.engineSize.trim()) {
    errors.engineSize = 'Tamanho do motor é obrigatório';
  } else {
    const engineSizeNum = parseFloat(data.engineSize.replace(',', '.'));
    
    if (isNaN(engineSizeNum)) {
      errors.engineSize = 'Tamanho do motor deve ser um número válido';
    } else if (engineSizeNum <= 0) {
      errors.engineSize = 'Tamanho do motor deve ser maior que 0';
    } else if (engineSizeNum > 10) {
      errors.engineSize = 'Tamanho do motor deve ser menor que 10L';
    }
  }

  return errors;
};

export const hasValidationErrors = (errors: VehicleValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

export const formatEngineSize = (value: string): string => {
  // Remove non-numeric characters except comma and dot
  let cleaned = value.replace(/[^\d.,]/g, '');
  
  // Replace comma with dot for decimal separator
  cleaned = cleaned.replace(',', '.');
  
  // Ensure only one decimal point
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // Limit to 2 decimal places
  if (parts.length === 2 && parts[1].length > 1) {
    cleaned = parts[0] + '.' + parts[1].substring(0, 1);
  }
  
  return cleaned;
};

export const formatYear = (value: string): string => {
  // Remove non-numeric characters
  const cleaned = value.replace(/\D/g, '');
  
  // Limit to 4 digits
  return cleaned.substring(0, 4);
};