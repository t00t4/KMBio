import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FormInput, FormPicker } from '../../components/forms';
import { useVehicleStore } from '../../stores/vehicles';
import { 
  VehicleFormData, 
  validateVehicleForm, 
  hasValidationErrors,
  formatEngineSize,
  formatYear,
  VehicleValidationErrors
} from '../../utils/validators/vehicleValidators';
import { FuelType } from '../../types/entities';

const FUEL_TYPE_OPTIONS = [
  { label: 'Gasolina', value: 'gasoline' },
  { label: 'Etanol', value: 'ethanol' },
  { label: 'Diesel', value: 'diesel' },
  { label: 'Flex (Gasolina/Etanol)', value: 'flex' },
];

export default function EditVehicleScreen(): React.JSX.Element {
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleId } = route.params as { vehicleId: string };
  
  const { vehicles, updateVehicle, loading } = useVehicleStore();
  const vehicle = vehicles.find(v => v.id === vehicleId);

  const [formData, setFormData] = useState<VehicleFormData>({
    name: '',
    make: '',
    model: '',
    year: '',
    fuelType: '',
    engineSize: '',
  });

  const [errors, setErrors] = useState<VehicleValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with vehicle data
  useEffect(() => {
    if (vehicle) {
      setFormData({
        name: vehicle.name,
        make: vehicle.make,
        model: vehicle.model,
        year: vehicle.year.toString(),
        fuelType: vehicle.fuelType,
        engineSize: vehicle.engineSize.toString(),
      });
    }
  }, [vehicle]);

  // If vehicle not found, show error
  if (!vehicle) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Veículo não encontrado</Text>
        <TouchableOpacity 
          style={styles.button}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleInputChange = (field: keyof VehicleFormData, value: string) => {
    let formattedValue = value;
    
    // Apply formatting for specific fields
    if (field === 'year') {
      formattedValue = formatYear(value);
    } else if (field === 'engineSize') {
      formattedValue = formatEngineSize(value);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleInputBlur = (field: keyof VehicleFormData) => {
    setTouched(prev => ({
      ...prev,
      [field]: true
    }));

    // Validate single field on blur
    const fieldErrors = validateVehicleForm(formData);
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field]
    }));
  };

  const handleSubmit = async () => {
    // Mark all fields as touched
    const allFields = Object.keys(formData) as (keyof VehicleFormData)[];
    setTouched(allFields.reduce((acc, field) => ({ ...acc, [field]: true }), {}));

    // Validate form
    const validationErrors = validateVehicleForm(formData);
    setErrors(validationErrors);

    if (hasValidationErrors(validationErrors)) {
      Alert.alert(
        'Dados inválidos',
        'Por favor, corrija os erros no formulário antes de continuar.'
      );
      return;
    }

    try {
      await updateVehicle(vehicleId, {
        name: formData.name.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: parseInt(formData.year, 10),
        fuelType: formData.fuelType as FuelType,
        engineSize: parseFloat(formData.engineSize.replace(',', '.')),
      });

      Alert.alert(
        'Sucesso',
        'Veículo atualizado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Erro',
        error instanceof Error ? error.message : 'Erro ao atualizar veículo'
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Editar Veículo</Text>
          <Text style={styles.subtitle}>
            Atualize as informações do seu veículo
          </Text>
          
          <View style={styles.form}>
            <FormInput
              label="Nome do veículo"
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              onBlur={() => handleInputBlur('name')}
              placeholder="Ex: Meu Honda Civic"
              error={touched.name ? errors.name : undefined}
              required
              maxLength={50}
            />

            <FormInput
              label="Marca"
              value={formData.make}
              onChangeText={(value) => handleInputChange('make', value)}
              onBlur={() => handleInputBlur('make')}
              placeholder="Ex: Honda, Toyota, Volkswagen"
              error={touched.make ? errors.make : undefined}
              required
              maxLength={30}
            />

            <FormInput
              label="Modelo"
              value={formData.model}
              onChangeText={(value) => handleInputChange('model', value)}
              onBlur={() => handleInputBlur('model')}
              placeholder="Ex: Civic, Corolla, Golf"
              error={touched.model ? errors.model : undefined}
              required
              maxLength={30}
            />

            <FormInput
              label="Ano"
              value={formData.year}
              onChangeText={(value) => handleInputChange('year', value)}
              onBlur={() => handleInputBlur('year')}
              placeholder="Ex: 2020"
              error={touched.year ? errors.year : undefined}
              required
              keyboardType="numeric"
              maxLength={4}
            />

            <FormPicker
              label="Tipo de combustível"
              value={formData.fuelType}
              onValueChange={(value) => handleInputChange('fuelType', value)}
              options={FUEL_TYPE_OPTIONS}
              placeholder="Selecione o tipo de combustível"
              error={touched.fuelType ? errors.fuelType : undefined}
              required
            />

            <FormInput
              label="Tamanho do motor (L)"
              value={formData.engineSize}
              onChangeText={(value) => handleInputChange('engineSize', value)}
              onBlur={() => handleInputBlur('engineSize')}
              placeholder="Ex: 1.6, 2.0"
              error={touched.engineSize ? errors.engineSize : undefined}
              required
              keyboardType="decimal-pad"
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    lineHeight: 22,
  },
  form: {
    marginBottom: 32,
  },
  button: {
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorText: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
  },
});